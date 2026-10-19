import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { historyWithBuild, scanPackage } from "./export-names";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function fakePackage(pkg: object, files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "sdk-export-names-"));
  dirs.push(dir);
  writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
  for (const [path, code] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), code);
  }
  return dir;
}

describe("scanPackage", () => {
  test("reads the runtime entry named by exports, following relative siblings", () => {
    const dir = fakePackage(
      { version: "1.2.0", main: "./dist/old.js", exports: { ".": { import: "./lib/entry.js" } } },
      {
        "lib/entry.js": `export { a as Widget }; export * from "./parts/more.js";`,
        "lib/parts/more.js": `export const useEntity = 1;`,
      },
    );
    expect(scanPackage(dir)).toEqual(["Widget", "useEntity"]);
  });

  test("falls back to main when exports names no import entry", () => {
    const dir = fakePackage(
      { version: "1.0.0", main: "./dist/index.js" },
      { "dist/index.js": `export { Widget };` },
    );
    expect(scanPackage(dir)).toEqual(["Widget"]);
  });

  test("an entry re-exporting a package cannot be scanned", () => {
    const dir = fakePackage(
      { version: "1.0.0", main: "./dist/index.js" },
      { "dist/index.js": `export * from "@glasshome/ui/solid";` },
    );
    expect(scanPackage(dir)).toBeNull();
  });
});

describe("historyWithBuild", () => {
  test("adds the build's own version to the committed history", () => {
    const dir = fakePackage(
      { version: "1.3.0", main: "./dist/index.js" },
      { "dist/index.js": `export { Widget, useEntity };` },
    );
    expect(historyWithBuild(dir, { "1.0.0": ["Widget"] })).toEqual({
      "1.0.0": ["Widget"],
      "1.3.0": ["Widget", "useEntity"],
    });
  });
});
