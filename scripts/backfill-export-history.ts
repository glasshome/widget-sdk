#!/usr/bin/env bun
// Usage: bun scripts/backfill-export-history.ts [--all]. Adds every release npm lists below this version that the committed file lacks.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { completeHistory, type ExportHistory } from "./export-names";
import { publishedVersions, scanPublished } from "./published-exports";

const pkgDir = join(import.meta.dir, "..");
const historyPath = join(pkgDir, "export-history.json");

const own: string = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf-8")).version;
const committed: ExportHistory = process.argv.includes("--all")
  ? {}
  : JSON.parse(readFileSync(historyPath, "utf-8"));

const history = completeHistory({
  committed,
  releases: publishedVersions(),
  own,
  scan: scanPublished,
});
writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`);
console.log(
  `Export history: ${Object.keys(history).length} versions, ${Object.keys(history).length - Object.keys(committed).length} added.`,
);
