import { afterAll, describe, expect, spyOn, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
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

  test("unchanged shape does not rewrite the hash file", async () => {
    // Regression: an unconditional write on every build made `bun widget
    // connect`'s fs watcher see its own output as a source change, rebuilding
    // forever (bug 1543588417600753795).
    const hashFile = join(tmpDir, "unchanged.schema-hash");
    await runSchemaGuard({
      outFile: writeBundle(`title: z.string()`, 1),
      hashFile,
      widgetName: "unchanged",
    });
    const mtimeBefore = statSync(hashFile).mtimeMs;
    await runSchemaGuard({
      outFile: writeBundle(`title: z.string()`, 1),
      hashFile,
      widgetName: "unchanged",
    });
    expect(statSync(hashFile).mtimeMs).toBe(mtimeBefore);
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

  test("renaming an optional nested field without a configVersion bump fails the build", async () => {
    // `required` is unchanged by an optional field's rename, so this is only
    // visible to a serialiser that reaches inside `properties`.
    const hashFile = join(tmpDir, "rename.schema-hash");
    await runSchemaGuard({
      outFile: writeBundle(`title: z.string(), subtitle: z.string().optional()`, 1),
      hashFile,
      widgetName: "rename",
    });
    await expect(
      runSchemaGuard({
        outFile: writeBundle(`title: z.string(), caption: z.string().optional()`, 1),
        hashFile,
        widgetName: "rename",
      }),
    ).rejects.toThrow(/without a configVersion bump/);
  });

  test("changing an enum's members without a configVersion bump fails the build", async () => {
    const hashFile = join(tmpDir, "enum.schema-hash");
    await runSchemaGuard({
      outFile: writeBundle(`fit: z.enum(["cover", "contain"])`, 1),
      hashFile,
      widgetName: "enum",
    });
    await expect(
      runSchemaGuard({
        outFile: writeBundle(`fit: z.enum(["cover", "stretch"])`, 1),
        hashFile,
        widgetName: "enum",
      }),
    ).rejects.toThrow(/without a configVersion bump/);
  });

  test("record without hashVersion warns and re-records instead of failing", async () => {
    // A community author's .schema-hash predates the serialiser change; its
    // hash is not comparable, so failing their build would blame them for a
    // change they never made.
    const hashFile = join(tmpDir, "unversioned.schema-hash");
    writeFileSync(hashFile, `${JSON.stringify({ hash: "0123456789abcdef", configVersion: 1 })}\n`);
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    try {
      await runSchemaGuard({
        outFile: writeBundle(`title: z.string()`, 1),
        hashFile,
        widgetName: "unversioned",
      });
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }

    const record = JSON.parse(readFileSync(hashFile, "utf-8"));
    expect(record.hashVersion).toBeGreaterThan(0);
    expect(record.hash).not.toBe("0123456789abcdef");

    // Upgraded record is comparable, so the next shape change is caught.
    await expect(
      runSchemaGuard({
        outFile: writeBundle(`title: z.number()`, 1),
        hashFile,
        widgetName: "unversioned",
      }),
    ).rejects.toThrow(/without a configVersion bump/);
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
