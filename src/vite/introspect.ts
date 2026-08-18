/**
 * Reads a built widget bundle's definition and prints it as JSON.
 *
 * One-shot counterpart to introspect-worker.ts: a fresh process per check, used
 * by `bun widget build`, the render worker's capture, and as the
 * GLASSHOME_WIDGET_NO_WORKER fallback.
 *
 * Usage: bun --conditions browser introspect.js <bundle.js>
 * Prints: { manifest, jsonSchema, exampleConfigIssues } on stdout, or exits
 * non-zero with a reason.
 */

import { installDom, introspectBundle } from "./introspect-core";

async function main(): Promise<void> {
  const bundlePath = process.argv[2];
  if (!bundlePath) {
    process.stderr.write("introspect: no bundle path given\n");
    process.exit(2);
  }

  await installDom();
  process.stdout.write(JSON.stringify(await introspectBundle(bundlePath)));
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
