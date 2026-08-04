import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runSchemaGuard } from "./index";

// Fixture bundles live inside the repo so their `import "zod"` resolves
// against this package's node_modules.
const tmpDir = mkdtempSync(join(import.meta.dir, ".example-configs-test-"));

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

let fixtureCount = 0;

/** A built widget bundle with both a configSchema and examples, the only
    combination where an example's config can be checked against anything. */
function writeBundle(schemaFields: string, examples: string): string {
  const outFile = join(tmpDir, `bundle-${fixtureCount++}.js`);
  writeFileSync(
    outFile,
    `import { z } from "zod";
export default {
  manifest: { name: "config-test", examples: ${examples} },
  configSchema: z.object({ ${schemaFields} }),
};
`,
  );
  return outFile;
}

function guard(schemaFields: string, examples: string) {
  const outFile = writeBundle(schemaFields, examples);
  return runSchemaGuard({
    outFile,
    hashFile: join(tmpDir, `hash-${fixtureCount}.json`),
    widgetName: "config-test",
  });
}

const ENTITY_SCHEMA = `title: z.string(), entityIds: z.array(z.string())`;

function example(config: string, label = "ok"): string {
  return `{ label: "${label}", size: { w: 2, h: 2 }, config: ${config} }`;
}

describe("example configs are parsed against the widget's own configSchema", () => {
  test("a config the schema accepts passes", async () => {
    await expect(
      guard(ENTITY_SCHEMA, `[${example(`{ title: "Lamp", entityIds: ["light.a"] }`)}]`),
    ).resolves.toBeUndefined();
  });

  test("a missing required field fails the build", async () => {
    // Typechecks only if the author skipped the generic; either way the preview
    // would render empty.
    await expect(guard(ENTITY_SCHEMA, `[${example(`{ title: "Lamp" }`)}]`)).rejects.toThrow(
      /entityIds/,
    );
  });

  test("a wrong field type fails the build", async () => {
    await expect(
      guard(ENTITY_SCHEMA, `[${example(`{ title: "Lamp", entityIds: "light.a" }`)}]`),
    ).rejects.toThrow(/entityIds/);
  });

  test("a constraint the TypeScript type cannot express fails the build", async () => {
    // The whole reason this check exists: `mode: string` typechecks, and only
    // the schema knows which strings are real.
    await expect(
      guard(`mode: z.enum(["grid", "list"])`, `[${example(`{ mode: "carousel" }`)}]`),
    ).rejects.toThrow(/mode/);
  });

  test("names the widget, the failing example and its label", async () => {
    const error = await guard(
      ENTITY_SCHEMA,
      `[${example(`{ title: "Lamp", entityIds: [] }`, "good")}, ${example(`{ title: 42 }`, "broken")}]`,
    ).catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    expect(message).toContain("config-test");
    expect(message).toContain("broken");
    expect(message).toContain("examples[1]");
    // The passing example must not be reported.
    expect(message).not.toContain("good");
  });

  test("a widget with no configSchema is not checked", async () => {
    const outFile = join(tmpDir, "no-schema.js");
    writeFileSync(
      outFile,
      `export default { manifest: { name: "config-test", examples: [{ size: { w: 2, h: 2 }, config: { anything: true } }] } };\n`,
    );
    await expect(
      runSchemaGuard({
        outFile,
        hashFile: join(tmpDir, "no-schema.json"),
        widgetName: "config-test",
      }),
    ).resolves.toBeUndefined();
  });

  test("a widget with no examples is not checked", async () => {
    const outFile = join(tmpDir, "no-examples.js");
    writeFileSync(
      outFile,
      `import { z } from "zod";
export default { manifest: { name: "config-test" }, configSchema: z.object({ title: z.string() }) };\n`,
    );
    await expect(
      runSchemaGuard({
        outFile,
        hashFile: join(tmpDir, "no-examples.json"),
        widgetName: "config-test",
      }),
    ).resolves.toBeUndefined();
  });

  test("the shape guard reports a malformed entry, not the schema", async () => {
    // A missing `config` is a shape error. Reporting it as a schema rejection
    // would point the author at their schema instead of their example.
    await expect(
      guard(ENTITY_SCHEMA, `[{ label: "bare", size: { w: 2, h: 2 } }]`),
    ).rejects.toThrow(/Invalid `examples`/);
  });
});
