#!/usr/bin/env bun
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import {
  buildSdkVersion,
  compareSdkVersions,
  exportNames,
} from "@glasshome/widget-contract/sdk-floor";

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
  const version = buildSdkVersion(JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf-8")));
  if (!version) throw new Error(`${pkgDir}/package.json has no version`);
  const names = scanPackage(pkgDir);
  if (!names) throw new Error(`cannot scan the exports of ${pkgDir} ${version}`);
  return sortHistory({ ...committed, [version]: names });
}

export function sortHistory(history: ExportHistory): ExportHistory {
  const keys = Object.keys(history).sort(compareSdkVersions);
  return Object.fromEntries(keys.map((k) => [k, history[k] ?? []]));
}

export function isRelease(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/** Stable releases from 1.0.0 below `own` among `versions` that `history` has no entry for. */
export function uncoveredReleases(
  history: ExportHistory,
  versions: readonly string[],
  own: string,
): string[] {
  return versions
    .filter(
      (v) =>
        isRelease(v) &&
        compareSdkVersions(v, "1.0.0") >= 0 &&
        compareSdkVersions(v, own) < 0 &&
        !(v in history),
    )
    .sort(compareSdkVersions);
}

/** The committed history plus every release below `own` that it skips; throws when one cannot be read. */
export function completeHistory(input: {
  committed: ExportHistory;
  releases: readonly string[];
  own: string;
  scan: (version: string) => string[] | null;
}): ExportHistory {
  const { committed, releases, own, scan } = input;
  const added: ExportHistory = {};
  for (const version of uncoveredReleases(committed, releases, own)) {
    let names: string[] | null;
    try {
      names = scan(version);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(
        `export history lacks ${version} and the registry could not supply it: ${detail}`,
      );
    }
    if (!names)
      throw new Error(`export history lacks ${version} and its exports cannot be scanned`);
    added[version] = names;
  }
  return sortHistory({ ...committed, ...added });
}
