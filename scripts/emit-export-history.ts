#!/usr/bin/env bun
// Writes dist/export-history.json: every release the changelog lists, plus this build. Skipped releases are read from npm.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { releasesInChangelog } from "@glasshome/widget-contract/sdk-floor";
import { completeHistory, type ExportHistory, historyWithBuild } from "./export-names";
import { scanPublished } from "./published-exports";

const pkgDir = join(import.meta.dir, "..");
const read = (file: string): string => readFileSync(join(pkgDir, file), "utf-8");

const committed: ExportHistory = JSON.parse(read("export-history.json"));
const own: string = JSON.parse(read("package.json")).version;

const completed = completeHistory({
  committed,
  releases: releasesInChangelog(read("CHANGELOG.md")),
  own,
  scan: scanPublished,
});
const added = Object.keys(completed).length - Object.keys(committed).length;
if (added > 0) {
  writeFileSync(join(pkgDir, "export-history.json"), `${JSON.stringify(completed, null, 2)}\n`);
}

const history = historyWithBuild(pkgDir, completed);
writeFileSync(join(pkgDir, "dist/export-history.json"), `${JSON.stringify(history, null, 2)}\n`);
console.log(
  `Export history: ${Object.keys(history).length} versions in dist/export-history.json, ${added} read from npm.`,
);
