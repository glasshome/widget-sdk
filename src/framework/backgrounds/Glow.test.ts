/**
 * Phase 26 Plan 01 (Wave 0) — RED source-literal regression tests for the
 * Glow channel migration (D-18). Tests fail until Plan 03 rewrites Glow.tsx.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

const SRC = readFileSync(resolve(import.meta.dir, "Glow.tsx"), "utf8");
const COLLAPSED = SRC.replace(/\s+/g, " ");

describe("Glow.tsx channel migration (Phase 26, RED until Plan 03)", () => {
  test("removes COLOR_MAP Tailwind lookup (D-18)", () => {
    expect(SRC).not.toContain("COLOR_MAP");
    expect(SRC).not.toContain("bg-blue-500/30");
    expect(SRC).not.toContain("bg-green-500/30");
  });

  test("removes ColorVariant type import (D-18)", () => {
    expect(SRC).not.toContain("ColorVariant");
  });

  test("uses color-mix(in oklch in inline style (D-18)", () => {
    expect(SRC).toContain("color-mix(in oklch");
    expect(COLLAPSED).toContain("radial-gradient(circle,");
  });

  test("color prop is optional CSS string override that sets --widget-color (D-18)", () => {
    expect(COLLAPSED).toMatch(/color\?:\s*string/);
    expect(COLLAPSED).toContain('"--widget-color"');
  });
});
