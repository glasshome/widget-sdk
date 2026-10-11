import { afterAll, describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createManualClock } from "@glasshome/widget-contract/clock";
import {
  createIntrospectSession,
  type IntrospectSessionOptions,
  type WorkerTransport,
} from "./introspect-session";

const tmpDir = mkdtempSync(join(import.meta.dir, ".introspect-session-test-"));

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

let fixtureCount = 0;

function writeBundle(body: string, file?: string): string {
  const outFile = file ?? join(tmpDir, `bundle-${fixtureCount++}.js`);
  writeFileSync(outFile, body);
  return outFile;
}

function namedWidget(name: string): string {
  return `export default { manifest: { name: ${JSON.stringify(name)} } };\n`;
}

describe("createIntrospectSession on a real worker", () => {
  test("round-trips requests through one worker and falls back without one", async () => {
    const session = createIntrospectSession();
    try {
      const first = await session.introspect(writeBundle(namedWidget("alpha")));
      const pid = session.childPid;
      const second = await session.introspect(writeBundle(namedWidget("beta")));
      expect(first.ok && first.value.manifest?.name).toBe("alpha");
      expect(second.ok && second.value.manifest?.name).toBe("beta");
      expect(session.childPid).toBe(pid);

      const noisy = writeBundle(`console.log("stray line");\n${namedWidget("noisy")}`);
      const afterNoise = await session.introspect(noisy);
      expect(afterNoise.ok && afterNoise.value.manifest?.name).toBe("noisy");

      const path = join(tmpDir, "rewritten.js");
      writeBundle(namedWidget("before"), path);
      const before = await session.introspect(path);
      writeBundle(namedWidget("after"), path);
      const after = await session.introspect(path);
      expect(before.ok && before.value.manifest?.name).toBe("before");
      expect(after.ok && after.value.manifest?.name).toBe("after");

      await session.introspect(writeBundle(`window.__poisoned = 1;\n${namedWidget("poisoner")}`));
      const leak = await session.introspect(
        writeBundle(`export default { manifest: { name: String(window.__poisoned) } };\n`),
      );
      expect(leak.ok && leak.value.manifest?.name).toBe("undefined");
    } finally {
      await session.dispose();
    }

    process.env.GLASSHOME_WIDGET_NO_WORKER = "1";
    try {
      const oneShot = createIntrospectSession();
      const result = await oneShot.introspect(writeBundle(namedWidget("fallback")));
      expect(oneShot.childPid).toBeNull();
      expect(result.ok && result.value.manifest?.name).toBe("fallback");
    } finally {
      delete process.env.GLASSHOME_WIDGET_NO_WORKER;
    }
  }, 60_000);

  test("worker exits when its parent is hard-killed", async () => {
    const bundle = writeBundle(namedWidget("orphan"));
    const parent = spawn(
      process.execPath,
      [join(import.meta.dir, "fixtures", "orphan-parent.ts"), bundle],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    // The worker inherits this stderr pipe, so it closes only once the worker has exited too.
    const stderrClosed = new Promise<void>((resolve) => parent.stderr?.on("close", resolve));
    parent.stderr?.pipe(process.stderr);

    const childPid = await new Promise<number>((resolve) => {
      let out = "";
      parent.stdout?.setEncoding("utf-8");
      parent.stdout?.on("data", (chunk: string) => {
        out += chunk;
        const nl = out.indexOf("\n");
        if (nl >= 0) resolve(Number(out.slice(0, nl).trim()));
      });
    });

    expect(Number.isFinite(childPid)).toBe(true);
    parent.kill("SIGKILL");

    await stderrClosed;
  }, 30_000);
});

const READY = JSON.stringify({ id: 0, ready: true });

interface FakeWorker {
  transport: WorkerTransport;
  written: string[];
  killed: boolean;
  writable: boolean;
  say(msg: object | string): void;
  exit(reason: string): void;
  answer(name: string, extra?: object): void;
}

function fakeTransports() {
  const workers: FakeWorker[] = [];
  const spawnWorker = (): WorkerTransport => {
    let lineCb: (line: string) => void = () => {};
    let exitCb: (reason: string) => void = () => {};
    const worker: FakeWorker = {
      written: [],
      killed: false,
      writable: true,
      say: (msg) => lineCb(typeof msg === "string" ? msg : JSON.stringify(msg)),
      exit: (reason) => exitCb(reason),
      answer(name, extra) {
        const id = JSON.parse(worker.written[worker.written.length - 1] ?? "{}").id;
        worker.say({ id, ok: true, value: { manifest: { name } }, ...extra });
      },
      transport: {
        write(line) {
          if (!worker.writable) return false;
          worker.written.push(line);
          return true;
        },
        onLine: (cb) => {
          lineCb = cb;
        },
        onExit: (cb) => {
          exitCb = cb;
        },
        kill() {
          worker.killed = true;
        },
        pid: 1000 + workers.length,
      },
    };
    workers.push(worker);
    return worker.transport;
  };
  return { workers, spawnWorker };
}

function setup(options?: IntrospectSessionOptions) {
  const clock = createManualClock();
  const fake = fakeTransports();
  const session = createIntrospectSession({ ...options, clock, spawnWorker: fake.spawnWorker });
  return { clock, session, ...fake };
}

const nameOf = (
  r: { ok: true; value: { manifest?: { name?: string } } } | { ok: false; reason: string },
) => (r.ok ? r.value.manifest?.name : r.reason);

describe("createIntrospectSession on a fake transport", () => {
  test("queues a second request until the first answers", async () => {
    const { clock, session, workers } = setup();
    const first = session.introspect("a.js");
    const second = session.introspect("b.js");
    await clock.advance(0);
    workers[0]?.say(READY);
    await clock.advance(0);

    expect(workers[0]?.written).toHaveLength(1);
    workers[0]?.answer("first");
    expect(nameOf(await first)).toBe("first");
    await clock.advance(0);

    expect(workers[0]?.written).toHaveLength(2);
    workers[0]?.answer("second");
    expect(nameOf(await second)).toBe("second");
    expect(workers).toHaveLength(1);
  });

  test("kills a hung worker at the timeout and serves the next request from a new one", async () => {
    const { clock, session, workers } = setup({ timeoutMs: 5_000 });
    const hung = session.introspect("hang.js");
    await clock.advance(0);
    workers[0]?.say(READY);
    await clock.advance(4_999);
    expect(workers[0]?.killed).toBe(false);

    await clock.advance(1);
    const result = await hung;
    expect(result.ok === false && result.reason).toMatch(/timed out after 5000ms/);
    expect(workers[0]?.killed).toBe(true);

    const next = session.introspect("ok.js");
    await clock.advance(0);
    workers[1]?.say(READY);
    await clock.advance(0);
    workers[1]?.answer("after-hang");
    expect(nameOf(await next)).toBe("after-hang");
    expect(clock.pending()).toBe(0);
  });

  test("a replaced worker's late exit does not fail the successor's request", async () => {
    const { clock, session, workers } = setup({ rssLimitBytes: 1 });
    const first = session.introspect("a.js");
    await clock.advance(0);
    workers[0]?.say(READY);
    await clock.advance(0);
    workers[0]?.answer("predecessor", { rss: 2 });
    expect((await first).ok).toBe(true);

    const next = session.introspect("b.js");
    await clock.advance(0);
    expect(workers[0]?.killed).toBe(true);
    workers[1]?.say(READY);
    await clock.advance(0);
    expect(workers[1]?.written).toHaveLength(1);

    workers[0]?.exit("introspect worker exited (signal SIGTERM)");
    await clock.advance(0);
    expect(session.childPid).toBe(workers[1]?.transport.pid ?? -1);

    workers[1]?.answer("after-stale-exit");
    expect(nameOf(await next)).toBe("after-stale-exit");
  });

  test("resolves rather than hangs when the worker dies mid-request", async () => {
    const { clock, session, workers } = setup();
    const crashed = session.introspect("crash.js");
    await clock.advance(0);
    workers[0]?.say(READY);
    await clock.advance(0);
    workers[0]?.exit("introspect worker exited (code 0)");
    const result = await crashed;
    expect(result.ok === false && result.reason).toMatch(/exited/);
    expect(session.childPid).toBeNull();

    const next = session.introspect("ok.js");
    await clock.advance(0);
    workers[1]?.say(READY);
    await clock.advance(0);
    workers[1]?.answer("after-crash");
    expect(nameOf(await next)).toBe("after-crash");
  });

  test("fails the request when the worker exits before it is ready", async () => {
    const { clock, session, workers } = setup();
    const request = session.introspect("a.js");
    await clock.advance(0);
    workers[0]?.exit("spawn ENOENT");
    const result = await request;
    expect(result.ok === false && result.reason).toBe("spawn ENOENT");
  });

  test("respawns once RSS crosses the limit", async () => {
    const { clock, session, workers } = setup({ rssLimitBytes: 100 });
    const first = session.introspect("a.js");
    await clock.advance(0);
    workers[0]?.say(READY);
    await clock.advance(0);
    workers[0]?.answer("first", { rss: 50 });
    await first;

    const second = session.introspect("b.js");
    await clock.advance(0);
    expect(workers).toHaveLength(1);
    workers[0]?.answer("second", { rss: 500 });
    await second;

    const third = session.introspect("c.js");
    await clock.advance(0);
    expect(workers[0]?.killed).toBe(true);
    expect(workers).toHaveLength(2);
    workers[1]?.say(READY);
    await clock.advance(0);
    workers[1]?.answer("third");
    expect(nameOf(await third)).toBe("third");
  });

  test("retires a worker whose stdin is not writable", async () => {
    const { clock, session, workers } = setup();
    const request = session.introspect("a.js");
    await clock.advance(0);
    if (workers[0]) workers[0].writable = false;
    workers[0]?.say(READY);
    const result = await request;
    expect(result.ok === false && result.reason).toMatch(/not writable/);
    expect(clock.pending()).toBe(0);
  });

  test("dispose kills the worker and refuses new requests", async () => {
    const { clock, session, workers } = setup();
    const request = session.introspect("a.js");
    await clock.advance(0);
    workers[0]?.say(READY);
    await clock.advance(0);
    await session.dispose();

    const result = await request;
    expect(result.ok === false && result.reason).toMatch(/disposed/);
    expect(workers[0]?.killed).toBe(true);
    expect(session.childPid).toBeNull();
    const after = await session.introspect("b.js");
    expect(after.ok === false && after.reason).toMatch(/disposed/);
  });
});
