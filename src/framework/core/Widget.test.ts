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

  test("calls injectTokens inside onMount in WidgetBase", () => {
    expect(COLLAPSED).toMatch(/onMount\(\(\)\s*=>\s*\{\s*injectTokens\(\)/);
  });

  test("outer div has glasshome-widget class as first cn arg", () => {
    expect(COLLAPSED).toContain('cn( "glasshome-widget",');
  });

  test("no async createEffect added", () => {
    expect(SRC).not.toContain("createEffect(async");
  });
});
