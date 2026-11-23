import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "vite";
import { catalogImportPlugin } from "./index";

const FIXTURES = join(import.meta.dir, "fixtures");
const tmpDir = mkdtempSync(join(import.meta.dir, ".locales-import-test-"));

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

async function bundle(fixture: string): Promise<string> {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    plugins: [catalogImportPlugin()],
    build: {
      write: false,
      minify: false,
      lib: { entry: join(FIXTURES, fixture, "entry.ts"), formats: ["es"], fileName: "out" },
    },
  });
  const outputs = Array.isArray(result)
    ? result.flatMap((r) => r.output)
    : "output" in result
      ? result.output
      : [];
  return outputs.map((o) => ("code" in o ? o.code : "")).join("\n");
}

describe("locale imports", () => {
  test("a locales json import compiles to a bundled catalog with no parser in the chunk", async () => {
    const code = await bundle("locales-ok");
    expect(code).not.toContain("compileMessage");
    expect(code).not.toContain("{n, plural");
    const file = join(tmpDir, "chunk.mjs");
    writeFileSync(file, code);
    const { default: catalog } = (await import(file)) as {
      default: { v: number; messages: Record<string, unknown> };
    };
    expect(catalog.v).toBe(1);
    expect(Object.keys(catalog.messages)).toEqual(["rooms"]);
  });

  test("a message that does not parse fails the build and names the key", async () => {
    await expect(bundle("locales-bad")).rejects.toThrow(/en\.json: bad: /);
  });
});
