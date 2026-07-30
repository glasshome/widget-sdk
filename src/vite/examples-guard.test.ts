import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MAX_EXAMPLES, runSchemaGuard } from "./index";

// Fixture bundles live inside the repo so their `import "zod"` resolves
// against this package's node_modules.
const tmpDir = mkdtempSync(join(import.meta.dir, ".examples-guard-test-"));

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

let fixtureCount = 0;

/** A built widget bundle declaring `examples`, with no configSchema, so these
    cases also prove the check runs before the configSchema early return. */
function writeBundle(examples: string): string {
  const outFile = join(tmpDir, `bundle-${fixtureCount++}.js`);
  writeFileSync(
    outFile,
    `export default { manifest: { name: "examples-test", examples: ${examples} } };\n`,
  );
  return outFile;
}

function guard(examples: string) {
  const outFile = writeBundle(examples);
  return runSchemaGuard({
    outFile,
    hashFile: join(tmpDir, `hash-${fixtureCount}.json`),
    widgetName: "examples-test",
  });
}

function example(label: string): string {
  return `{ label: "${label}", size: { w: 2, h: 2 }, config: { title: "x" } }`;
}

function examples(n: number): string {
  return `[${Array.from({ length: n }, (_, i) => example(`e${i}`)).join(",")}]`;
}

describe("examples guard", () => {
  test("a widget with no examples is fine", async () => {
    const outFile = join(tmpDir, "no-examples.js");
    writeFileSync(outFile, `export default { manifest: { name: "examples-test" } };\n`);
    expect(
      runSchemaGuard({ outFile, hashFile: join(tmpDir, "h.json"), widgetName: "examples-test" }),
    ).resolves.toBeUndefined();
  });

  test(`accepts exactly ${MAX_EXAMPLES}`, async () => {
    expect(guard(examples(MAX_EXAMPLES))).resolves.toBeUndefined();
  });

  test(`rejects ${MAX_EXAMPLES + 1}, rather than silently dropping the extra`, async () => {
    // The bug this exists for: the hub rendered up to its cap and the gallery
    // looked complete while missing states the author had written.
    expect(guard(examples(MAX_EXAMPLES + 1))).rejects.toThrow(/at most 20 are rendered/);
  });

  test("rejects a fractional tile size", async () => {
    expect(
      guard(`[{ label: "half", size: { w: 2.5, h: 2 }, config: {} }]`),
    ).rejects.toThrow(/examples/);
  });

  test("rejects a zero or negative tile size", async () => {
    expect(guard(`[{ label: "none", size: { w: 0, h: 2 }, config: {} }]`)).rejects.toThrow(
      /examples/,
    );
  });

  test("rejects a missing config", async () => {
    expect(guard(`[{ label: "bare", size: { w: 2, h: 2 } }]`)).rejects.toThrow(/examples/);
  });

  test("names the widget and the offending index", async () => {
    // The author needs to know which of several examples is wrong.
    expect(
      guard(`[${example("ok")}, { label: "bad", size: { w: 2 }, config: {} }]`),
    ).rejects.toThrow(/examples-test/);
  });
});
