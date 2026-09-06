import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { WidgetIntrospection } from "./introspect-core";

export type IntrospectResult =
  | { ok: true; value: WidgetIntrospection }
  | { ok: false; reason: string };

export interface IntrospectSessionOptions {
  /** Respawn once the worker's RSS crosses this, between requests only. */
  rssLimitBytes?: number;
  /** Per-request ceiling; a module-eval hang can only be cured by a kill. */
  timeoutMs?: number;
  /** Log spawn and import durations above this. */
  slowMs?: number;
}

export interface IntrospectSession {
  introspect(outFile: string): Promise<IntrospectResult>;
  dispose(): Promise<void>;
  readonly childPid: number | null;
}

const DEFAULT_RSS_LIMIT = 250 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_SLOW_MS = 3_000;

// .js when running from dist, .ts when running from source (tests), so the
// tests exercise the same subprocess the build uses rather than a stand-in.
function resolveEntry(base: string): string | null {
  const here = dirname(fileURLToPath(import.meta.url));
  return [join(here, `${base}.js`), join(here, `${base}.ts`)].find((p) => existsSync(p)) ?? null;
}

/** One process per check. The path `build`, `capture` and the fallback take. */
export function introspectOnce(outFile: string): IntrospectResult {
  const probe = resolveEntry("introspect");
  if (!probe) return { ok: false, reason: "introspect not found next to the sdk" };

  const run = spawnSync(process.execPath, ["--conditions", "browser", probe, outFile], {
    encoding: "utf-8",
    // A widget that loops at import time must not hang the build.
    timeout: DEFAULT_TIMEOUT_MS,
  });

  if (run.error) return { ok: false, reason: run.error.message };
  if (run.status !== 0) {
    const detail = (run.stderr || "").trim().split("\n")[0] || `exit ${run.status}`;
    return { ok: false, reason: detail };
  }
  try {
    return { ok: true, value: JSON.parse(run.stdout) as WidgetIntrospection };
  } catch {
    return { ok: false, reason: "introspect returned unparseable output" };
  }
}

interface WorkerResponse {
  id: number;
  ready?: boolean;
  ok?: boolean;
  value?: WidgetIntrospection;
  reason?: string;
  rss?: number;
  importMs?: number;
}

function oneShotSession(): IntrospectSession {
  return {
    introspect: async (outFile) => introspectOnce(outFile),
    dispose: async () => {},
    childPid: null,
  };
}

/**
 * A worker reused across rebuilds, for callers that own a session.
 *
 * Only `bun widget connect`'s watch loop does: it is the one call site that
 * re-pays the per-check process boot tax on every save.
 */
export function createIntrospectSession(options?: IntrospectSessionOptions): IntrospectSession {
  if (process.env.GLASSHOME_WIDGET_NO_WORKER === "1") return oneShotSession();

  const rssLimit = options?.rssLimitBytes ?? DEFAULT_RSS_LIMIT;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const slowMs = options?.slowMs ?? DEFAULT_SLOW_MS;

  type Resolve = (result: IntrospectResult) => void;

  // One generation of the child process. Its requests live on it, so a worker
  // that dies late can only ever settle its own.
  interface Worker {
    proc: ChildProcess;
    ready: Promise<void>;
    pending: Map<number, Resolve>;
    retireAfterRequest: boolean;
  }

  let current: Worker | null = null;
  let disposed = false;
  let nextId = 0;
  let queue: Promise<unknown> = Promise.resolve();

  function settle(worker: Worker, why: string): void {
    for (const resolve of worker.pending.values()) resolve({ ok: false, reason: why });
    worker.pending.clear();
  }

  function retire(worker: Worker, why: string): void {
    if (current === worker) current = null;
    settle(worker, why);
    worker.proc.kill();
  }

  function onLine(worker: Worker, line: string): void {
    let msg: WorkerResponse;
    try {
      msg = JSON.parse(line) as WorkerResponse;
    } catch {
      return;
    }
    if (typeof msg.id !== "number") return;
    const resolve = worker.pending.get(msg.id);
    if (!resolve) return;
    worker.pending.delete(msg.id);

    if ((msg.rss ?? 0) > rssLimit) worker.retireAfterRequest = true;
    if ((msg.importMs ?? 0) > slowMs) {
      console.warn(`[widget-sdk] introspection took ${msg.importMs}ms`);
    }
    resolve(
      msg.ok
        ? { ok: true, value: msg.value as WidgetIntrospection }
        : { ok: false, reason: msg.reason ?? "introspection failed" },
    );
  }

  function spawnWorker(probe: string): Worker {
    const spawnedAt = Date.now();
    const proc = spawn(process.execPath, ["--conditions", "browser", probe], {
      stdio: ["pipe", "pipe", "inherit"],
    });
    const worker: Worker = {
      proc,
      ready: Promise.resolve(),
      pending: new Map(),
      retireAfterRequest: false,
    };

    worker.ready = new Promise<void>((resolve, reject) => {
      let buffer = "";
      let booted = false;

      proc.stdout?.setEncoding("utf-8");
      proc.stdout?.on("data", (chunk: string) => {
        buffer += chunk;
        let nl = buffer.indexOf("\n");
        while (nl >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (line) {
            if (!booted && line.includes('"ready"')) {
              booted = true;
              const bootMs = Date.now() - spawnedAt;
              if (bootMs > slowMs) {
                console.warn(`[widget-sdk] introspect worker took ${bootMs}ms to boot`);
              }
              resolve();
            } else {
              onLine(worker, line);
            }
          }
          nl = buffer.indexOf("\n");
        }
      });

      const gone = (why: string) => {
        if (!booted) reject(new Error(why));
        if (current === worker) current = null;
        settle(worker, why);
      };
      proc.on("error", (err) => gone(err.message));
      proc.on("exit", (code, signal) =>
        gone(`introspect worker exited (${signal ?? `code ${code}`})`),
      );
    });

    return worker;
  }

  async function run(outFile: string): Promise<IntrospectResult> {
    if (disposed) return { ok: false, reason: "introspect session disposed" };
    const probe = resolveEntry("introspect-worker");
    if (!probe) return { ok: false, reason: "introspect-worker not found next to the sdk" };

    if (current?.retireAfterRequest) retire(current, "worker was replaced");
    const worker = current ?? (current = spawnWorker(probe));
    try {
      await worker.ready;
    } catch (err) {
      return { ok: false, reason: err instanceof Error ? err.message : String(err) };
    }
    if (!worker.proc.stdin?.writable) {
      return { ok: false, reason: "introspect worker is not writable" };
    }

    const id = ++nextId;
    return new Promise<IntrospectResult>((resolve) => {
      const timer = setTimeout(() => {
        worker.pending.delete(id);
        // An in-process hang cannot be cancelled; only the kill ends it.
        retire(worker, `introspection timed out after ${timeoutMs}ms`);
        resolve({ ok: false, reason: `introspection timed out after ${timeoutMs}ms` });
      }, timeoutMs);

      worker.pending.set(id, (result) => {
        clearTimeout(timer);
        resolve(result);
      });

      try {
        worker.proc.stdin?.write(`${JSON.stringify({ id, outFile })}\n`);
      } catch (err) {
        clearTimeout(timer);
        worker.pending.delete(id);
        worker.retireAfterRequest = true;
        resolve({ ok: false, reason: err instanceof Error ? err.message : String(err) });
      }
    });
  }

  return {
    introspect(outFile: string): Promise<IntrospectResult> {
      const next = queue.then(() => run(outFile));
      queue = next.catch(() => undefined);
      return next;
    },
    async dispose(): Promise<void> {
      disposed = true;
      if (current) retire(current, "introspect session disposed");
    },
    get childPid(): number | null {
      return current?.proc.pid ?? null;
    },
  };
}
