/**
 * Phase 26 Plan 01 (Wave 0) — RED source-literal regression tests for the
 * WidgetIcon channel refactor. These tests pin the post-Plan-03 shape;
 * they fail until Plan 03 rewrites WidgetIcon.tsx.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

const SRC = readFileSync(resolve(import.meta.dir, "WidgetIcon.tsx"), "utf8");
const COLLAPSED = SRC.replace(/\s+/g, " ");

describe("WidgetIcon channel refactor (Phase 26, RED until Plan 03)", () => {
  test("imports no adaptive-color helper (D-15)", () => {
    expect(SRC).not.toContain("adaptive-color");
    expect(SRC).not.toContain("deriveAdaptiveIconColors");
  });

  test("WidgetIconProps removes glow prop (VIS-A05, D-15)", () => {
    // No `glow?:` field in the props interface.
    expect(COLLAPSED).not.toMatch(/glow\?:\s*string/);
  });

  test("WidgetIconProps removes dynamicColor prop (VIS-A05, D-15)", () => {
    expect(SRC).not.toContain("dynamicColor");
  });

  test("WidgetIconProps declares color prop as CSS string (VIS-A05, D-14)", () => {
    expect(COLLAPSED).toMatch(/color\?:\s*string/);
  });

  test("root element carries glasshome-widget-icon class (D-16)", () => {
    expect(SRC).toContain("glasshome-widget-icon");
  });

  test("sets --widget-icon-color inline when color prop is set (D-14)", () => {
    expect(COLLAPSED).toContain('"--widget-icon-color"');
  });

  test("no Tailwind shadow-[ arbitrary classes remain (VIS-P03, D-16)", () => {
    expect(SRC).not.toContain("shadow-[");
  });

  test("no useDynamic / adaptive / bgStyle / glowStyle branches (D-15)", () => {
    expect(SRC).not.toContain("useDynamic");
    expect(SRC).not.toContain("deriveAdaptiveIconColors");
    // bgStyle/glowStyle accessors removed — single render path
    const hasBgStyle = /const\s+bgStyle\s*=/.test(SRC);
    const hasGlowStyle = /const\s+glowStyle\s*=/.test(SRC);
    expect(hasBgStyle).toBe(false);
    expect(hasGlowStyle).toBe(false);
  });

  test("entityCount stacked backgrounds preserved (D-17)", () => {
    expect(SRC).toContain("entityCount");
  });
});

describe("WidgetIcon dead-code purge (D-15)", () => {
  test("adaptive-color.ts is not present in the source tree", () => {
    // Read framework/theming/index.ts and confirm no re-export of adaptive-color.
    const themingIndex = readFileSync(
      resolve(import.meta.dir, "../theming/index.ts"),
      "utf8",
    );
    expect(themingIndex).not.toContain("adaptive-color");
    expect(themingIndex).not.toContain("deriveAdaptiveIconColors");
  });
});
