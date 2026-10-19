#!/usr/bin/env bun
// Usage: bun scripts/backfill-export-history.ts [--all]. Publish runs it before the build.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compareSdkVersions } from "@glasshome/widget-contract/sdk-floor";
import { type ExportHistory, isRelease, scanPackage, sortHistory } from "./export-names";

const PACKAGE = "@glasshome/widget-sdk";
const pkgDir = join(import.meta.dir, "..");
const historyPath = join(pkgDir, "export-history.json");

function run(cmd: string, args: string[], cwd: string): string {
  const res = spawnSync(cmd, args, { cwd, encoding: "utf-8" });
  if (res.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed:\n${res.stderr}`);
  return res.stdout;
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

const own: string = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf-8")).version;
const history: ExportHistory = process.argv.includes("--all")
  ? {}
  : JSON.parse(readFileSync(historyPath, "utf-8"));
const published: string[] = JSON.parse(run("npm", ["view", PACKAGE, "versions", "--json"], pkgDir));
const wanted = published.filter(
  (v) => isRelease(v) && compareSdkVersions(v, "1.0.0") >= 0 && compareSdkVersions(v, own) < 0,
);
const missing = wanted.filter((v) => !(v in history));

const leftOut: string[] = [];
for (const version of missing) {
  const names = scanPublished(version);
  if (names) history[version] = names;
  else leftOut.push(version);
  console.log(`${version}: ${names ? `${names.length} exports` : "cannot scan"}`);
}

writeFileSync(historyPath, `${JSON.stringify(sortHistory(history), null, 2)}\n`);
console.log(`Export history: ${Object.keys(history).length} versions, ${missing.length} added.`);
if (leftOut.length > 0) {
  console.error(`Cannot scan ${leftOut.join(", ")}; the history would hide a release.`);
  process.exit(1);
}
