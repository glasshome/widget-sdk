#!/usr/bin/env bun
// Build guard: the host entry creates no context of its own (a context made
// here is a second instance no widget can read), and every declaration file
// the package advertises exists. Asserted on the emitted artifact.

import { existsSync, readFileSync } from "node:fs";

const HOST_ENTRY = "dist/host/index.js";

/**
 * `build` is `vite build && tsc`, and vite empties dist first. A tsc that never
 * ran leaves a dist with every .js in place and no .d.ts at all, which looks
 * built and installs fine; consumers only find out later as TS7016 "implicitly
 * has an 'any' type". Assert the types this package advertises actually exist.
 */
function declaredTypePaths(): string[] {
  const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
  const found = new Set<string>();
  const walk = (node: unknown): void => {
    if (typeof node !== "object" || node === null) return;
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === "types" && typeof value === "string") found.add(value);
      else walk(value);
    }
  };
  if (typeof pkg.types === "string") found.add(pkg.types);
  walk(pkg.exports);
  return [...found];
}

const source = readFileSync(HOST_ENTRY, "utf-8");
const failures: string[] = [];

// A context created inside this entry is a second instance by definition.
if (/createContext\s*\(/.test(source)) {
  failures.push(
    `${HOST_ENTRY} calls createContext(). The host entry must import every context from ` +
      `"@glasshome/widget-sdk", never create one: a context created here is a second instance no widget can read.`,
  );
}

const missingTypes = declaredTypePaths().filter((p) => !existsSync(p));
if (missingTypes.length > 0) {
  failures.push(
    `package.json advertises ${missingTypes.length} declaration file(s) that dist does not have ` +
      `(${missingTypes.join(", ")}). tsc did not finish, so this build emits JS with no types.`,
  );
}

if (failures.length > 0) {
  console.error("Host singleton check failed:\n");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Host singleton check: ${HOST_ENTRY} creates no context.`);
