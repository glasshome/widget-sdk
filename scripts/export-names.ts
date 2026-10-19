#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { exportNames } from "@glasshome/widget-contract/sdk-floor";

export type ExportHistory = Record<string, string[]>;

function runtimeEntry(pkg: { main?: unknown; exports?: unknown }): string | null {
  const dot =
    typeof pkg.exports === "object" && pkg.exports !== null
      ? (pkg.exports as Record<string, unknown>)["."]
      : undefined;
  const importEntry =
    typeof dot === "object" && dot !== null ? (dot as Record<string, unknown>).import : undefined;
  if (typeof importEntry === "string") return importEntry;
  return typeof pkg.main === "string" ? pkg.main : null;
}

/** Export names of the package's runtime entry in `pkgDir`, read as text and never executed. */
export function scanPackage(pkgDir: string): string[] | null {
  const root = resolve(pkgDir);
  const entry = runtimeEntry(JSON.parse(readFileSync(join(root, "package.json"), "utf-8")));
  if (!entry) return null;
  const entryPath = resolve(root, entry);
  const read = (path: string): string | null =>
    path.startsWith(root + sep) && existsSync(path) ? readFileSync(path, "utf-8") : null;
  const entryCode = read(entryPath);
  if (entryCode === null) return null;
  return exportNames(entryCode, (spec) => read(resolve(dirname(entryPath), spec)));
}

export function historyWithBuild(pkgDir: string, committed: ExportHistory): ExportHistory {
  const { version } = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf-8"));
  const names = scanPackage(pkgDir);
  if (!names) throw new Error(`cannot scan the exports of ${pkgDir} ${version}`);
  return sortHistory({ ...committed, [version]: names });
}

export function sortHistory(history: ExportHistory): ExportHistory {
  const keys = Object.keys(history).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  return Object.fromEntries(keys.map((k) => [k, history[k] ?? []]));
}

if (import.meta.main && process.argv.includes("--emit")) {
  const pkgDir = join(import.meta.dir, "..");
  const committed: ExportHistory = JSON.parse(
    readFileSync(join(pkgDir, "export-history.json"), "utf-8"),
  );
  const history = historyWithBuild(pkgDir, committed);
  writeFileSync(join(pkgDir, "dist/export-history.json"), `${JSON.stringify(history, null, 2)}\n`);
  console.log(
    `Export history: ${Object.keys(history).length} versions in dist/export-history.json.`,
  );
}
