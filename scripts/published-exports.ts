import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanPackage } from "./export-names";

export const PACKAGE = "@glasshome/widget-sdk";

export function run(cmd: string, args: string[], cwd: string): string {
  const res = spawnSync(cmd, args, { cwd, encoding: "utf-8" });
  if (res.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed:\n${res.stderr}`);
  return res.stdout;
}

/** Export names of a published release, read from its npm tarball; null when its entry cannot be scanned. */
export function scanPublished(version: string): string[] | null {
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
      packDir,
    );
    return scanPackage(join(extractDir, "package"));
  } finally {
    rmSync(packDir, { recursive: true, force: true });
    rmSync(extractDir, { recursive: true, force: true });
  }
}
