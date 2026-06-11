/**
 * Phase 25 Plan 02 — source-literal regression tests for Widget.tsx
 * token-injection + .glasshome-widget class wiring.
 *
 * Asserts the compile-time shape of Widget.tsx without booting a DOM:
 *  - import { injectTokens } from "../theming/tokens" present
 *  - onMount imported from solid-js
 *  - onMount(() => { injectTokens() ... }) call site present
 *  - outer div's cn(...) starts with "glasshome-widget"
 *  - no async createEffect introduced (CLAUDE.md SolidJS rule)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

const SRC = readFileSync(resolve(import.meta.dir, "Widget.tsx"), "utf8");
const COLLAPSED = SRC.replace(/\s+/g, " ");

describe("Widget.tsx token injection wiring (Phase 25 Plan 02)", () => {
  test("imports injectTokens from theming/tokens", () => {
    expect(SRC).toContain('import { injectTokens } from "../theming/tokens"');
  });

  test("imports onMount from solid-js", () => {
    const solidImportLine = SRC.split("\n").find((l) => l.includes('from "solid-js"')) ?? "";
    expect(solidImportLine).toContain("onMount");
  });

  test("calls injectTokens inside onMount in WidgetBase with the shell's root node", () => {
    expect(COLLAPSED).toMatch(/onMount\(\(\)\s*=>\s*\{[^}]*injectTokens\(/);
    expect(SRC).toContain("getRootNode()");
  });

  test("outer div has glasshome-widget class as first cn arg", () => {
    expect(COLLAPSED).toContain('cn( "glasshome-widget",');
  });

  test("no async createEffect added", () => {
    expect(SRC).not.toContain("createEffect(async");
  });
});

describe("Widget.tsx prop API (Phase 26, RED until Plan 02)", () => {
  test("WidgetProps declares tone prop typed as Tone (VIS-A01, D-07)", () => {
    expect(COLLAPSED).toMatch(/tone\?:\s*Tone/);
  });

  test("WidgetProps declares color prop as CSS string (VIS-A02, D-08)", () => {
    expect(COLLAPSED).toMatch(/color\?:\s*string/);
  });

  test("WidgetProps declares colorTo prop as CSS string (VIS-A03, D-09)", () => {
    expect(COLLAPSED).toMatch(/colorTo\?:\s*string/);
  });

  test("WidgetProps gradient prop documented as CSS gradient string (VIS-A04, D-10) — Tailwind class wording removed", () => {
    // Phase 26 repurposes `gradient` from Tailwind class string to CSS gradient string.
    expect(SRC).not.toContain('"bg-gradient-to-br from-cyan-600/40');
    // Acceptable docstring wording references "CSS gradient" or "gradient string".
    expect(SRC).toMatch(/gradient.*CSS|CSS.*gradient/i);
  });

  test("backgroundGlow prop is removed (D-11)", () => {
    expect(SRC).not.toContain("backgroundGlow");
  });

  test("inline channelStyle memo writes --widget-color / --widget-color-to / --widget-gradient (D-07..D-10)", () => {
    expect(COLLAPSED).toContain('"--widget-color"');
    expect(COLLAPSED).toContain('"--widget-color-to"');
    expect(COLLAPSED).toContain('"--widget-gradient"');
    // tone path: `var(--tone-${props.tone})` template literal
    expect(COLLAPSED).toMatch(/var\(--tone-\$\{props\.tone\}\)/);
  });

  test("shell DOM collapsed — no inner gradient div, no bg-blue-500 loading, no bg-gradient-to-br empty-state (D-01, D-12, D-13)", () => {
    // Loading overlay: bg-blue-500/20 removed; uses glasshome-widget-loading class or inline color-mix
    expect(SRC).not.toContain("bg-blue-500/20");
    // Empty-state Tailwind gray gradient removed (D-12)
    expect(SRC).not.toContain("bg-gradient-to-br from-gray-500/20 to-gray-600/20");
    // finalGradient memo removed
    expect(SRC).not.toContain("finalGradient");
  });
});
