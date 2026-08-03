import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { createComponent, createRoot } from "solid-js";
import { _resetDeprecationWarnings, deprecate, deprecations } from "../../deprecations";
import { useWidgetDimensions, WidgetSizeCtx } from "./use-widget-dimensions";

describe("useWidgetDimensions", () => {
  test("throws outside <Widget> (no WidgetSizeCtx provider)", () => {
    createRoot((dispose) => {
      expect(() => useWidgetDimensions()).toThrow(
        "useWidgetDimensions must be called inside <Widget>",
      );
      dispose();
    });
  });

  test("returns the provided measured accessor inside the provider", () => {
    createRoot((dispose) => {
      let seen: { width: number; height: number } | undefined;
      createComponent(WidgetSizeCtx.Provider, {
        value: () => ({ width: 320, height: 180 }),
        get children() {
          seen = useWidgetDimensions()();
          return null;
        },
      });
      expect(seen).toEqual({ width: 320, height: 180 });
      dispose();
    });
  });
});

describe("ctx.dimensions deprecation", () => {
  const prevEnv = process.env.NODE_ENV;
  let warnSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    _resetDeprecationWarnings();
    warnSpy = spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
    process.env.NODE_ENV = prevEnv;
  });

  test("is registered with the useWidgetDimensions replacement", () => {
    const entry = deprecations.find((d) => d.id === "ctx.dimensions");
    expect(entry?.replacement).toBe("useWidgetDimensions()");
    expect(entry?.sourcePattern).toBeTruthy();
  });

  test("warns once in dev and keeps returning measurements", () => {
    process.env.NODE_ENV = "development";
    const accessor = deprecate(() => ({ width: 10, height: 20 }), "ctx.dimensions");
    expect(accessor()).toEqual({ width: 10, height: 20 });
    expect(accessor()).toEqual({ width: 10, height: 20 });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("ctx.dimensions is deprecated");
  });
});

// Source-literal wiring assertions, same style as core/Widget.test.ts: the
// component can't be mounted under bun test (no DOM/JSX transform), so pin
// the provider + deprecate() wiring at the source level.
describe("Widget.tsx provides WidgetSizeCtx", () => {
  const SRC = readFileSync(resolve(import.meta.dir, "../core/Widget.tsx"), "utf8");

  test("renders a WidgetSizeCtx.Provider fed by the measured signal", () => {
    expect(SRC).toContain("<WidgetSizeCtx.Provider value={measured}>");
  });

  test("wraps the legacy ctx.dimensions accessor with deprecate()", () => {
    expect(SRC).toContain('dimensions: deprecate(() => measured(), "ctx.dimensions")');
  });
});
