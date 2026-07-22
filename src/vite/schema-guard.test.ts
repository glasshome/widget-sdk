import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runSchemaGuard } from "./index";

// Fixture bundles live inside the repo so their `import "zod"` resolves
// against this package's node_modules.
const tmpDir = mkdtempSync(join(import.meta.dir, ".schema-guard-test-"));

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

let fixtureCount = 0;

function writeBundle(fields: string, configVersion: number | undefined): string {
  const outFile = join(tmpDir, `bundle-${fixtureCount++}.js`);
  writeFileSync(
    outFile,
    `import { z } from "zod";
export default {
  manifest: { name: "guard-test"${configVersion === undefined ? "" : `, configVersion: ${configVersion}`} },
  configSchema: z.object({ ${fields} }),
};
`,
  );
  return outFile;
}

describe("runSchemaGuard", () => {
  test("first build records hash + configVersion", async () => {
    const hashFile = join(tmpDir, "a.schema-hash");
    const outFile = writeBundle(`title: z.string()`, 1);
    await runSchemaGuard({ outFile, hashFile, widgetName: "a" });
    const record = JSON.parse(readFileSync(hashFile, "utf-8"));
    expect(record.hash).toMatch(/^[a-f0-9]{16}$/);
    expect(record.configVersion).toBe(1);
  });

  test("shape change without configVersion bump fails the build", async () => {
    const hashFile = join(tmpDir, "b.schema-hash");
    await runSchemaGuard({ outFile: writeBundle(`title: z.string()`, 1), hashFile, widgetName: "b" });
    await expect(
      runSchemaGuard({
        outFile: writeBundle(`title: z.string(), count: z.number()`, 1),
        hashFile,
        widgetName: "b",
      }),
    ).rejects.toThrow(/without a configVersion bump/);
    // Failed run must not overwrite the record, so a rebuild still compares
    // against the pre-change shape.
    const record = JSON.parse(readFileSync(hashFile, "utf-8"));
    expect(record.configVersion).toBe(1);
  });

  test("shape change with configVersion bump passes and re-records", async () => {
    const hashFile = join(tmpDir, "c.schema-hash");
    await runSchemaGuard({ outFile: writeBundle(`title: z.string()`, 1), hashFile, widgetName: "c" });
    await runSchemaGuard({
      outFile: writeBundle(`title: z.string(), count: z.number()`, 2),
      hashFile,
      widgetName: "c",
    });
    const record = JSON.parse(readFileSync(hashFile, "utf-8"));
    expect(record.configVersion).toBe(2);
  });

  test("unchanged shape passes with same configVersion", async () => {
    const hashFile = join(tmpDir, "d.schema-hash");
    await runSchemaGuard({ outFile: writeBundle(`title: z.string()`, 1), hashFile, widgetName: "d" });
    await runSchemaGuard({ outFile: writeBundle(`title: z.string()`, 1), hashFile, widgetName: "d" });
    const record = JSON.parse(readFileSync(hashFile, "utf-8"));
    expect(record.configVersion).toBe(1);
  });

  test("legacy plain-hash record only warns, then upgrades to the JSON format", async () => {
    const hashFile = join(tmpDir, "e.schema-hash");
    writeFileSync(hashFile, "0123456789abcdef");
    await runSchemaGuard({
      outFile: writeBundle(`title: z.string()`, 1),
      hashFile,
      widgetName: "e",
    });
    const record = JSON.parse(readFileSync(hashFile, "utf-8"));
    expect(record.configVersion).toBe(1);
  });

  test("widget without configSchema is skipped", async () => {
    const hashFile = join(tmpDir, "f.schema-hash");
    const outFile = join(tmpDir, "no-schema.js");
    writeFileSync(outFile, `export default { manifest: { name: "f" } };\n`);
    await runSchemaGuard({ outFile, hashFile, widgetName: "f" });
    expect(existsSync(hashFile)).toBe(false);
  });

  test("manifestPath receives the generated JSON schema", async () => {
    const hashFile = join(tmpDir, "g.schema-hash");
    const manifestPath = join(tmpDir, "g-manifest.json");
    writeFileSync(manifestPath, JSON.stringify({ name: "g" }));
    await runSchemaGuard({
      outFile: writeBundle(`title: z.string()`, 1),
      hashFile,
      widgetName: "g",
      manifestPath,
    });
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    expect(manifest.schema?.type).toBe("object");
  });
});
