#!/usr/bin/env bun
// Writes dist/export-history.json: the committed history plus this build. Reads no network and writes no tracked file.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type ExportHistory, historyWithBuild } from "./export-names";

const pkgDir = join(import.meta.dir, "..");
const committed: ExportHistory = JSON.parse(
  readFileSync(join(pkgDir, "export-history.json"), "utf-8"),
);

const history = historyWithBuild(pkgDir, committed);
writeFileSync(join(pkgDir, "dist/export-history.json"), `${JSON.stringify(history, null, 2)}\n`);
console.log(`Export history: ${Object.keys(history).length} versions in dist/export-history.json.`);
