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

import { readFileSync } from "node:fs";

const HOST_ENTRY = "dist/host/index.js";
const SELF = "@glasshome/widget-sdk";

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

if (failures.length > 0) {
  console.error("Host singleton check failed:\n");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Host singleton check: ${HOST_ENTRY} reaches ${SELF} by name.`);
