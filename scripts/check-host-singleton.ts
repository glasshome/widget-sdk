#!/usr/bin/env bun
// Build guard: the host entry must reach this package's singletons by the
// package's own name, never carry its own copy.
//
// `WidgetCtx` is the handshake between a host and the widgets it mounts: the
// host writes a widget's context in, the widget reads it back out. That only
// works while both sides see the same module instance. Hosts resolve the bare
// specifier through their import map; `/host` must resolve it the same way,
// because a host is free to bundle `/host` and a relative import would travel
// into that bundle as a second, private copy.
//
// Asserted on the emitted artifact rather than the source, because the source
// can be right while a build config quietly inlines it — which is exactly how
// this failed: dash shipped a private WidgetCtx for two weeks, widgets threw on
// `useWidgetContext`, and every widget service call silently no-opped. Dev
// never reproduced it (Vite serves both graphs from one /@fs/ URL) and no test
// caught it, so the artifact is the only witness that counts (finding 45).

import { existsSync, readFileSync } from "node:fs";

const HOST_ENTRY = "dist/host/index.js";
const SELF = "@glasshome/widget-sdk";

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

/** Module state that breaks silently when duplicated, with why it matters. */
const SINGLETONS: Record<string, string> = {
  WidgetCtx: "the host-to-widget context handshake",
  injectTokens: "tracks which roots it has already styled",
};

const source = readFileSync(HOST_ENTRY, "utf-8");
const failures: string[] = [];

const selfImport = source.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*["']${SELF}["']`));

if (!selfImport) {
  failures.push(
    `${HOST_ENTRY} does not import "${SELF}". Either the self-reference was replaced with a ` +
      "relative import, or the build inlined it (check that this package's own name is in " +
      "vite.config.ts rollupOptions.external).",
  );
} else {
  // Imports survive minification as `{ WidgetCtx as r }`, so match the source name.
  const imported = selfImport[1];
  for (const [name, why] of Object.entries(SINGLETONS)) {
    if (!new RegExp(`\\b${name}\\b`).test(imported)) {
      failures.push(
        `${HOST_ENTRY} does not import "${name}" from "${SELF}" — so it holds its own copy, ` +
          `and ${why} breaks across the host/widget boundary.`,
      );
    }
  }
}

// A context created inside this entry is a second instance by definition.
if (/createContext\s*\(/.test(source)) {
  failures.push(
    `${HOST_ENTRY} calls createContext(). The host entry must import every context from ` +
      `"${SELF}", never create one: a context created here is a second instance no widget can read.`,
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

console.log(`Host singleton check: ${HOST_ENTRY} reaches ${SELF} by name.`);
