import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runSchemaGuard } from "./index";

const tmpDir = mkdtempSync(join(import.meta.dir, ".guards-integration-test-"));

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

test("the default introspector reads a real bundle in a subprocess", async () => {
  const outFile = join(tmpDir, "ok.js");
  const hashFile = join(tmpDir, "ok.schema-hash");
  writeFileSync(
    outFile,
    `import { z } from "zod";
export default { manifest: { name: "real", configVersion: 1 }, configSchema: z.object({ title: z.string() }) };
`,
  );
  await runSchemaGuard({ outFile, hashFile, widgetName: "real" });
  expect(JSON.parse(readFileSync(hashFile, "utf-8")).configVersion).toBe(1);
});

test("a bundle that throws on import fails the build", async () => {
  const outFile = join(tmpDir, "throws.js");
  writeFileSync(outFile, `throw new Error("boom at import");\n`);
  await expect(
    runSchemaGuard({ outFile, hashFile: join(tmpDir, "throws.schema-hash"), widgetName: "bad" }),
  ).rejects.toThrow(/Could not read "bad"/);
});
