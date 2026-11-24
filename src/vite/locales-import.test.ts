import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "vite";
import { catalogImportPlugin } from "./index";

const FIXTURES = join(import.meta.dir, "fixtures");
const tmpDir = mkdtempSync(join(import.meta.dir, ".locales-import-test-"));

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

async function bundle(fixture: string, root = FIXTURES): Promise<string> {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    plugins: [catalogImportPlugin()],
    build: {
      write: false,
      minify: false,
      lib: { entry: join(root, fixture, "entry.ts"), formats: ["es"], fileName: "out" },
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

/** Writes `files` under a fresh directory in tmpDir and returns it. */
function project(name: string, files: Record<string, string>): string {
  const dir = join(tmpDir, name);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return tmpDir;
}

const NESTED = JSON.stringify({ greeting: { morning: "Hello" } });

describe("locale files that are not the widget's catalog", () => {
  test("a dependency's locales json passes through as plain JSON", async () => {
    const root = project("dependency", {
      "manifest.json": '{ "name": "dependency" }',
      "entry.ts": 'import en from "./node_modules/dep/locales/en.json";\nexport default en;\n',
      "node_modules/dep/manifest.json": '{ "name": "dep" }',
      "node_modules/dep/locales/en.json": NESTED,
    });
    const code = await bundle("dependency", root);
    expect(code).toContain("morning");
    expect(code).not.toContain("messages");
  });

  test("a widget's own locales json away from its manifest passes through", async () => {
    const root = project("homegrown", {
      "manifest.json": '{ "name": "homegrown" }',
      "entry.ts": 'import en from "./lib/locales/en.json";\nexport default en;\n',
      "lib/locales/en.json": NESTED,
    });
    const code = await bundle("homegrown", root);
    expect(code).toContain("morning");
    expect(code).not.toContain("messages");
  });
});
