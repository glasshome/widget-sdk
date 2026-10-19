#!/usr/bin/env bun
// Usage: bun scripts/backfill-export-history.ts [--all]
// Adds every published release below this package's version that the history lacks.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type ExportHistory, scanPackage, sortHistory } from "./export-names";

const PACKAGE = "@glasshome/widget-sdk";
const pkgDir = join(import.meta.dir, "..");
const historyPath = join(pkgDir, "export-history.json");

function run(cmd: string, args: string[], cwd: string): string {
  const res = spawnSync(cmd, args, { cwd, encoding: "utf-8" });
  if (res.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed:\n${res.stderr}`);
  return res.stdout;
}

function core(v: string): number[] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function below(a: number[], b: number[]): boolean {
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0);
  }
  return false;
}

function scanPublished(version: string): string[] | null {
  const packDir = mkdtempSync(join(tmpdir(), "sdk-pack-"));
  const extractDir = mkdtempSync(join(tmpdir(), "sdk-extract-"));
  try {
    run("npm", ["pack", `${PACKAGE}@${version}`, "--ignore-scripts", "--silent"], packDir);
    const tarball = readdirSync(packDir).find((f) => f.endsWith(".tgz"));
    if (!tarball) throw new Error(`npm pack ${version} produced no tarball`);
    run(
      "tar",
      [
        "-xzf",
        join(packDir, tarball),
        "-C",
        extractDir,
        "--no-same-owner",
        "--no-same-permissions",
      ],
      pkgDir,
    );
    return scanPackage(join(extractDir, "package"));
  } finally {
    rmSync(packDir, { recursive: true, force: true });
    rmSync(extractDir, { recursive: true, force: true });
  }
}

const own = core(JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf-8")).version);
if (!own) throw new Error("package.json version is not x.y.z");
const history: ExportHistory = process.argv.includes("--all")
  ? {}
  : JSON.parse(readFileSync(historyPath, "utf-8"));
const published: string[] = JSON.parse(run("npm", ["view", PACKAGE, "versions", "--json"], pkgDir));
const wanted = published.filter((v) => {
  const c = core(v);
  return c !== null && (c[0] ?? 0) >= 1 && below(c, own) && !(v in history);
});

const leftOut: string[] = [];
for (const version of wanted) {
  const names = scanPublished(version);
  if (names) history[version] = names;
  else leftOut.push(version);
  console.log(`${version}: ${names ? `${names.length} exports` : "cannot scan, left out"}`);
}

writeFileSync(historyPath, `${JSON.stringify(sortHistory(history), null, 2)}\n`);
console.log(
  `Wrote ${Object.keys(history).length} versions. Left out: ${leftOut.join(", ") || "none"}.`,
);
