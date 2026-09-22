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
    // injectTokens types the legacy document path as Document; the stub
    // satisfies the InjectTokensRoot shape it actually uses.
    stub: stub as unknown as Document,
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

  test("icon glow default per mode", () => {
    const parts = css.split(".dark {");
    expect(parts.length).toBe(2);
    expect(parts[0]).toContain("--widget-glow-default:     0.4;");
    expect(parts[1]).toContain("--widget-glow-default:     0.5;");
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

describe("shell material is the ui glass formula", () => {
  const shellRule = () => {
    const start = css.indexOf(".glasshome-widget {\n  --widget-wash");
    if (start === -1) throw new Error("no glass knob block on the shell");
    return css.slice(start, css.indexOf("}", start));
  };

  test("the shell sets the wash strengths and leaves the tone to the widget", () => {
    expect(shellRule()).toContain("--widget-wash: 22%");
    expect(shellRule()).toContain("--widget-wash-2: 11%");
    expect(shellRule()).toContain("--glass-wash: var(--widget-wash)");
    expect(shellRule()).not.toContain("--glass-tone");
  });

  test("the shell wears the card recipe's knobs", () => {
    // The theme's material clarity when the host ui has it; the card recipe's 60% before ui 1.17.
    expect(shellRule()).toContain(
      "--glass-base: color-mix(in srgb, var(--card) var(--material-clarity, 60%), transparent)",
    );
    expect(shellRule()).toContain("--glass-rim: 0.3");
    expect(shellRule()).toContain("--glass-lift: 0.45");
    expect(shellRule()).toContain("--glass-shade: 0.05");
    expect(css).toContain(".dark .glasshome-widget {\n  --glass-shade: 0;");
  });

  test("the backdrop still rides the host-gated channel", () => {
    expect(shellRule()).toContain("backdrop-filter: var(--widget-backdrop, none)");
    expect(shellRule()).toContain("-webkit-backdrop-filter: var(--widget-backdrop, none)");
  });

  test("no second glass: the shell paints no gradient, rim or highlight of its own", () => {
    expect(css).not.toContain("--widget-border-highlight");
    expect(css).not.toContain("--widget-grad-strength");
    expect(css).not.toContain("var(--widget-gradient");
    expect(css).not.toContain("linear-gradient(135deg");
  });
});

describe("the icon disc and slider fill follow the material", () => {
  const rule = (selector: string) => {
    const start = css.indexOf(`\n${selector} {`);
    return css.slice(start, css.indexOf("\n}", start));
  };

  test("the disc is ui's tinted icon pill: its tone and the pill knobs, no paint of its own", () => {
    const icon = rule(".glasshome-widget-icon");
    expect(icon).toContain("--glass-tone: var(--widget-icon-color, var(--widget-color))");
    expect(icon).toContain("--glass-rim: 0.4");
    expect(icon).toContain("--glass-wash: 18%");
    expect(icon).not.toContain("background:");
    expect(icon).not.toContain("box-shadow:");
  });

  test("the slider fill is the card's own wash, so a full fill matches a toned card", () => {
    const fill = rule(".glasshome-widget-slider-fill");
    expect(fill).toContain("var(--widget-color) calc(var(--widget-wash) * var(--material-tint, 1))");
    expect(fill).not.toContain("--widget-icon-color");
  });

  test("glasshome-widget-loading — color-mix tint at 20% of widget-color", () => {
    expect(css).toContain(".glasshome-widget-loading {");
    expect(css).toContain("background: color-mix(in oklch, var(--widget-color) 20%, transparent)");
  });
});
