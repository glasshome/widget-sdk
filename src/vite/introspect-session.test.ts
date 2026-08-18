import { afterAll, describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createIntrospectSession } from "./introspect-session";

// Fixture bundles live inside the repo so their imports resolve against this
// package's node_modules.
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

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitUntil(predicate: () => boolean, ms: number): Promise<boolean> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return predicate();
}

describe("createIntrospectSession", () => {
  test("round-trips two requests through one worker", async () => {
    const session = createIntrospectSession();
    try {
      const first = await session.introspect(writeBundle(namedWidget("alpha")));
      const pid = session.childPid;
      const second = await session.introspect(writeBundle(namedWidget("beta")));

      expect(first.ok && first.value.manifest?.name).toBe("alpha");
      expect(second.ok && second.value.manifest?.name).toBe("beta");
      expect(session.childPid).toBe(pid);
    } finally {
      await session.dispose();
    }
  });

  test("survives a stray stdout line from the bundle", async () => {
    const session = createIntrospectSession();
    try {
      const noisy = writeBundle(
        `console.log("stray line from the widget");\n${namedWidget("noisy")}`,
      );
      const first = await session.introspect(noisy);
      const second = await session.introspect(writeBundle(namedWidget("after-noise")));

      expect(first.ok && first.value.manifest?.name).toBe("noisy");
      expect(second.ok && second.value.manifest?.name).toBe("after-noise");
    } finally {
      await session.dispose();
    }
  });

  test("re-reads the same path after it is rewritten", async () => {
    const session = createIntrospectSession();
    try {
      const path = join(tmpDir, "rewritten.js");
      writeBundle(namedWidget("before"), path);
      const first = await session.introspect(path);
      writeBundle(namedWidget("after"), path);
      const second = await session.introspect(path);

      expect(first.ok && first.value.manifest?.name).toBe("before");
      expect(second.ok && second.value.manifest?.name).toBe("after");
    } finally {
      await session.dispose();
    }
  });

  test("does not leak globals between requests", async () => {
    const session = createIntrospectSession();
    try {
      await session.introspect(writeBundle(`window.__poisoned = 1;\n${namedWidget("poisoner")}`));
      const result = await session.introspect(
        writeBundle(`export default { manifest: { name: String(window.__poisoned) } };\n`),
      );

      expect(result.ok && result.value.manifest?.name).toBe("undefined");
    } finally {
      await session.dispose();
    }
  });

  test("kills and respawns after a module-eval hang", async () => {
    const session = createIntrospectSession({ timeoutMs: 1_500 });
    try {
      const hung = await session.introspect(writeBundle(`while (true) {}\nexport default {};\n`));
      expect(hung.ok).toBe(false);
      expect(hung.ok === false && hung.reason).toMatch(/timed out/);

      const next = await session.introspect(writeBundle(namedWidget("after-hang")));
      expect(next.ok && next.value.manifest?.name).toBe("after-hang");
    } finally {
      await session.dispose();
    }
  }, 20_000);

  test("resolves rather than hangs when the worker dies mid-request", async () => {
    const session = createIntrospectSession();
    try {
      const crashed = await session.introspect(
        writeBundle(`process.exit(0);\nexport default {};\n`),
      );
      expect(crashed.ok).toBe(false);

      const next = await session.introspect(writeBundle(namedWidget("after-crash")));
      expect(next.ok && next.value.manifest?.name).toBe("after-crash");
    } finally {
      await session.dispose();
    }
  }, 20_000);

  test("respawns once RSS crosses the limit", async () => {
    const session = createIntrospectSession({ rssLimitBytes: 1 });
    try {
      await session.introspect(writeBundle(namedWidget("first")));
      const firstPid = session.childPid;
      const second = await session.introspect(writeBundle(namedWidget("second")));

      expect(second.ok && second.value.manifest?.name).toBe("second");
      expect(session.childPid).not.toBe(firstPid);
    } finally {
      await session.dispose();
    }
  }, 20_000);

  test("dispose kills the worker", async () => {
    const session = createIntrospectSession();
    await session.introspect(writeBundle(namedWidget("disposable")));
    const pid = session.childPid;
    expect(pid).not.toBeNull();
    await session.dispose();

    expect(await waitUntil(() => !alive(pid as number), 5_000)).toBe(true);
  });

  test("GLASSHOME_WIDGET_NO_WORKER falls back to one process per check", async () => {
    process.env.GLASSHOME_WIDGET_NO_WORKER = "1";
    try {
      const session = createIntrospectSession();
      const result = await session.introspect(writeBundle(namedWidget("fallback")));
      expect(session.childPid).toBeNull();
      expect(result.ok && result.value.manifest?.name).toBe("fallback");
      await session.dispose();
    } finally {
      delete process.env.GLASSHOME_WIDGET_NO_WORKER;
    }
  }, 20_000);

  test("worker exits when its parent is hard-killed", async () => {
    const bundle = writeBundle(namedWidget("orphan"));
    const parent = spawn(
      process.execPath,
      [join(import.meta.dir, "fixtures", "orphan-parent.ts"), bundle],
      { stdio: ["ignore", "pipe", "inherit"] },
    );

    const childPid = await new Promise<number>((resolve, reject) => {
      let out = "";
      const timer = setTimeout(() => reject(new Error("fixture never reported a pid")), 15_000);
      parent.stdout?.setEncoding("utf-8");
      parent.stdout?.on("data", (chunk: string) => {
        out += chunk;
        const nl = out.indexOf("\n");
        if (nl >= 0) {
          clearTimeout(timer);
          resolve(Number(out.slice(0, nl).trim()));
        }
      });
    });

    expect(Number.isFinite(childPid)).toBe(true);
    parent.kill("SIGKILL");

    expect(await waitUntil(() => !alive(childPid), 15_000)).toBe(true);
  }, 30_000);
});
