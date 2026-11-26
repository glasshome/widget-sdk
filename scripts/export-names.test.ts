import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { historyWithBuild, scanPackage, sortHistory } from "./export-names";

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

  test("keys the build by the first release of a major the package declares ahead of its version", () => {
    const dir = fakePackage(
      { version: "1.34.1", main: "./dist/index.js", glasshome: { sdkMajor: 2 } },
      { "dist/index.js": `export { Widget };` },
    );
    expect(Object.keys(historyWithBuild(dir, { "1.0.0": ["Widget"] }))).toEqual(["1.0.0", "2.0.0"]);
  });
});

describe("this package's declared major", () => {
  test("is its version's major, or the next one while the release that writes it is pending", () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dir, "..", "package.json"), "utf-8"));
    const versionMajor = Number(pkg.version.split(".")[0]);
    expect([versionMajor, versionMajor + 1]).toContain(pkg.glasshome.sdkMajor);
  });
});

describe("sortHistory", () => {
  test("orders by semver, prereleases before their release", () => {
    const sorted = sortHistory({
      "1.10.0": [],
      "1.9.0": [],
      "1.10.0-rc.1": [],
      "1.10.0-beta.2": [],
      "1.10.0-beta.10": [],
    });
    expect(Object.keys(sorted)).toEqual([
      "1.9.0",
      "1.10.0-beta.2",
      "1.10.0-beta.10",
      "1.10.0-rc.1",
      "1.10.0",
    ]);
  });
});
