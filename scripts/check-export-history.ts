#!/usr/bin/env bun
// Usage: bun scripts/check-export-history.ts. Fails when export-history.json lacks a release npm lists below this version.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type ExportHistory, uncoveredReleases } from "./export-names";
import { publishedVersions } from "./published-exports";

const pkgDir = join(import.meta.dir, "..");
const history: ExportHistory = JSON.parse(
  readFileSync(join(pkgDir, "export-history.json"), "utf-8"),
);
const own: string = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf-8")).version;

const missing = uncoveredReleases(history, publishedVersions(), own);
if (missing.length > 0) {
  console.error(
    `export-history.json has no entry for ${missing.join(", ")}; run bun scripts/backfill-export-history.ts and commit it.`,
  );
  process.exit(1);
}
console.log(`export-history.json covers every release below ${own}.`);
