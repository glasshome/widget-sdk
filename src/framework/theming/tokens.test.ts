import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, test } from "bun:test";
import { __resetInjectedForTests, type InjectTokensRoot, injectTokens } from "./tokens";

const CSS_PATH = join(import.meta.dir, "tokens.css");
const css = readFileSync(CSS_PATH, "utf8");

function makeStub() {
  const appended: unknown[] = [];
  let querySelectorReturns: unknown = null;
  const stub: InjectTokensRoot = {
    head: {
      appendChild: (n) => {
        appended.push(n);
      },
      querySelector: () => querySelectorReturns,
    },
    createElement: () => ({
      setAttribute() {},
      textContent: null,
    }),
  };
  return {
    stub,
    appended,
    setQuerySelector(v: unknown) {
      querySelectorReturns = v;
    },
  };
}

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

describe("injection idempotent", () => {
  beforeEach(() => {
    __resetInjectedForTests();
  });

  test("module sentinel — repeated calls append once", () => {
    const { stub, appended } = makeStub();
    injectTokens(stub);
    injectTokens(stub);
    expect(appended).toHaveLength(1);
  });

  test("DOM sentinel — existing style[data-glasshome-tokens] short-circuits", () => {
    const { stub, appended, setQuerySelector } = makeStub();
    setQuerySelector({}); // truthy stand-in for existing <style> element
    injectTokens(stub);
    expect(appended).toHaveLength(0);
  });

  test("ssr safe — no document and no stub is a silent no-op", () => {
    expect(() => injectTokens(undefined)).not.toThrow();
  });
});

describe("Phase 26 shell gradient (VIS-P01)", () => {
  test("shell gradient — color-mix oklch formula at 135deg with 22%/11% asymmetric stops modulated by --widget-grad-strength", () => {
    expect(css).toContain("background: var(--widget-gradient,");
    expect(css).toContain("linear-gradient(135deg,");
    expect(css).toContain(
      "color-mix(in oklch, var(--widget-color) calc(22% * var(--widget-grad-strength)), transparent)",
    );
    expect(css).toContain(
      "color-mix(in oklch, var(--widget-color-to, var(--widget-color)) calc(11% * var(--widget-grad-strength)), transparent)",
    );
  });
});

describe("Phase 26 inset highlight (VIS-P02)", () => {
  test("inset highlight — single 1px highlight using --widget-border-highlight", () => {
    expect(css).toContain("box-shadow: inset 0 1px 0 var(--widget-border-highlight)");
  });
});

describe("Phase 26 icon glow rule (VIS-P03)", () => {
  test("glasshome-widget-icon — bg + glow with calc(--widget-glow-strength * 30px) and color-mix at 50% transparent", () => {
    expect(css).toContain(".glasshome-widget-icon {");
    expect(css).toContain("background: var(--widget-icon-color, var(--widget-color))");
    expect(css).toContain("box-shadow: 0 0 calc(var(--widget-glow-strength) * 30px)");
    expect(css).toContain(
      "color-mix(in oklch, var(--widget-icon-color, var(--widget-color)) 50%, transparent)",
    );
  });

  test("glasshome-widget-loading — color-mix tint at 20% of widget-color", () => {
    expect(css).toContain(".glasshome-widget-loading {");
    expect(css).toContain("background: color-mix(in oklch, var(--widget-color) 20%, transparent)");
  });
});
