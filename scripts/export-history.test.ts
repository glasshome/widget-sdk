import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

const root = join(import.meta.dir, "..");
const history: Record<string, string[]> = JSON.parse(
  readFileSync(join(root, "export-history.json"), "utf-8"),
);
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));

function older(a: string, b: string): boolean {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}

describe("export-history.json", () => {
  test("holds every released v1 below this version", () => {
    const tags = spawnSync("git", ["tag", "--list", "v1.*"], { cwd: root, encoding: "utf-8" })
      .stdout.split("\n")
      .map((t) => t.trim().replace(/^v/, ""))
      .filter((v) => /^\d+\.\d+\.\d+$/.test(v) && older(v, version));
    expect(tags.filter((v) => !(v in history))).toEqual([]);
  });

  test("holds past versions only; the build adds its own", () => {
    expect(Object.keys(history).filter((v) => !older(v, version))).toEqual([]);
  });

  test("every entry names Widget", () => {
    expect(Object.entries(history).filter(([, names]) => !names.includes("Widget"))).toEqual([]);
  });
});
