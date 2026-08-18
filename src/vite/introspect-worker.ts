/**
 * Long-lived introspection worker for `bun widget connect`.
 *
 * Newline-delimited JSON over stdio. Every request carries an id: a widget
 * bundle can print at module-eval time, and without id pairing one stray line
 * offsets every later response.
 *
 * Usage: bun --conditions browser introspect-worker.js
 */

import { installDom, introspectBundle } from "./introspect-core";

const writeProtocol = process.stdout.write.bind(process.stdout);

// Best-effort only; Bun's native console may bypass this. The id is the guarantee.
process.stdout.write = ((chunk: unknown, ...rest: unknown[]) =>
  (process.stderr.write as unknown as (...args: unknown[]) => boolean)(
    chunk,
    ...rest,
  )) as typeof process.stdout.write;

function send(payload: Record<string, unknown>): void {
  writeProtocol(`${JSON.stringify(payload)}\n`);
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

let inFlightId: number | null = null;
let importCount = 0;
let queue: Promise<void> = Promise.resolve();

async function handle(id: number, outFile: string): Promise<void> {
  inFlightId = id;
  const started = performance.now();
  try {
    await installDom();
    const value = await introspectBundle(outFile, String(++importCount));
    send({
      id,
      ok: true,
      value,
      rss: process.memoryUsage().rss,
      importMs: Math.round(performance.now() - started),
    });
  } catch (err) {
    send({
      id,
      ok: false,
      reason: describe(err),
      rss: process.memoryUsage().rss,
      importMs: Math.round(performance.now() - started),
    });
  } finally {
    inFlightId = null;
  }
}

function enqueue(line: string): void {
  let req: { id?: unknown; outFile?: unknown };
  try {
    req = JSON.parse(line) as { id?: unknown; outFile?: unknown };
  } catch {
    return;
  }
  if (typeof req.id !== "number" || typeof req.outFile !== "string") return;
  const { id, outFile } = req;
  queue = queue.then(() => handle(id, outFile));
}

function die(err: unknown): void {
  if (inFlightId !== null) {
    send({
      id: inFlightId,
      ok: false,
      reason: describe(err),
      rss: process.memoryUsage().rss,
      importMs: 0,
    });
  }
  process.exit(1);
}

process.on("uncaughtException", die);
process.on("unhandledRejection", die);

let buffer = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk: string) => {
  buffer += chunk;
  let nl = buffer.indexOf("\n");
  while (nl >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (line) enqueue(line);
    nl = buffer.indexOf("\n");
  }
});

// The OS closes this pipe even when the parent is SIGKILLed, so it is the
// primary orphan defense.
process.stdin.on("end", () => process.exit(0));
process.stdin.on("close", () => process.exit(0));
process.stdin.resume();

// Backstop. A "did ppid change" check cannot work: Windows never reparents.
const parentPid = process.ppid;
setInterval(() => {
  try {
    process.kill(parentPid, 0);
  } catch {
    process.exit(0);
  }
}, 5_000);

send({ id: 0, ready: true });
