import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { compareSdkVersions } from "@glasshome/widget-contract/sdk-floor";
import { isRelease } from "./export-names";

const root = join(import.meta.dir, "..");
const history: Record<string, string[]> = JSON.parse(
  readFileSync(join(root, "export-history.json"), "utf-8"),
);
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const older = (v: string): boolean => compareSdkVersions(v, version) < 0;

const releasedBelow = spawnSync("git", ["tag", "--list", "v1.*"], { cwd: root, encoding: "utf-8" })
  .stdout.split("\n")
  .map((t) => t.trim().replace(/^v/, ""))
  .filter((v) => isRelease(v) && older(v))
  .sort(compareSdkVersions);

// Publish backfills the tail before it builds; EXPORT_HISTORY_COMPLETE makes that step prove it.
const mustBeComplete = process.env.EXPORT_HISTORY_COMPLETE === "1";

if (releasedBelow.length === 0 && !process.env.CI) {
  console.warn("export-history: no v1 git tags in this checkout, release coverage not checked");
}

describe("export-history.json", () => {
  test.skipIf(releasedBelow.length === 0 && !process.env.CI)(
    "has no hole among the released versions it covers",
    () => {
      expect(releasedBelow.length).toBeGreaterThan(0);
      const newest = Object.keys(history).sort(compareSdkVersions).at(-1) ?? "0.0.0";
      const covered = mustBeComplete
        ? releasedBelow
        : releasedBelow.filter((v) => compareSdkVersions(v, newest) <= 0);
      expect(covered.filter((v) => !(v in history))).toEqual([]);
    },
  );

  test("holds past versions only; the build adds its own", () => {
    expect(Object.keys(history).filter((v) => !older(v))).toEqual([]);
  });

  test("every entry names Widget", () => {
    expect(Object.entries(history).filter(([, names]) => !names.includes("Widget"))).toEqual([]);
  });
});
