#!/usr/bin/env bun
// Usage: bun scripts/backfill-export-history.ts [--all]. Adds every published release the committed file lacks.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compareSdkVersions } from "@glasshome/widget-contract/sdk-floor";
import { type ExportHistory, isRelease, sortHistory } from "./export-names";
import { PACKAGE, run, scanPublished } from "./published-exports";

const pkgDir = join(import.meta.dir, "..");
const historyPath = join(pkgDir, "export-history.json");

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
