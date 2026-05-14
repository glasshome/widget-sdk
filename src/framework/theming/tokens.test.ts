import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

const CSS_PATH = join(import.meta.dir, "tokens.css");
const css = readFileSync(CSS_PATH, "utf8");

describe("tokens.css contract", () => {
  test("tone vars at root and dark", () => {
    // All 6 tones declared under :root and under .dark — each appears ≥ 2 times.
    const tones = [
      "--tone-success",
      "--tone-warning",
      "--tone-danger",
      "--tone-info",
      "--tone-neutral",
      "--tone-accent",
    ];
    for (const name of tones) {
      const occurrences = css.split(name).length - 1;
      expect(occurrences).toBeGreaterThanOrEqual(2);
    }
    expect(css).toContain(":root {");
    expect(css).toContain(".dark {");
    // oklch literals present
    expect(css).toContain("oklch(");
  });

  test("channel defaults", () => {
    expect(css).toContain(".glasshome-widget {");
    expect(css).toContain("--widget-color:");
    expect(css).toContain("--widget-glow-strength: var(--widget-glow-default)");
  });

  test("envelope vars per mode", () => {
    const parts = css.split(".dark {");
    expect(parts.length).toBe(2);
    const rootChunk = parts[0] ?? "";
    const darkChunk = parts[1] ?? "";
    expect(rootChunk).toContain("--widget-grad-strength:    1;");
    expect(darkChunk).toContain("--widget-grad-strength:    1.1;");
    // All three envelope vars present in both chunks
    for (const v of [
      "--widget-grad-strength",
      "--widget-glow-default",
      "--widget-border-highlight",
    ]) {
      expect(rootChunk).toContain(v);
      expect(darkChunk).toContain(v);
    }
  });

  test("atproperty widget-color", () => {
    expect(css).toContain("@property --widget-color {");
    expect(css).toContain('syntax: "<color>";');
    expect(css).toContain("inherits: true;");
    expect(css).toContain("initial-value: oklch(0.65 0.02 250)");
    // initial-value must be a literal, not a var() reference
    const atPropIdx = css.indexOf("@property --widget-color");
    const closingBrace = css.indexOf("}", atPropIdx);
    const block = css.slice(atPropIdx, closingBrace);
    expect(block).not.toContain("initial-value: var(");
  });
});
