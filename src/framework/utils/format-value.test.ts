import { describe, expect, test } from "bun:test";
import { createComponent, createRoot } from "solid-js";
import type { WidgetI18n } from "../i18n/context";
import { type ReactiveWidgetContext, WidgetCtx } from "../hooks/use-widget-context";
import { formatValue } from "./format-value";

function inWidget(formatting: string, read: () => string): string {
  const i18n: WidgetI18n = {
    language: "en",
    formatting,
    catalog: null,
    sdk: null,
    ui: null,
    states: null,
  };
  const ctx: ReactiveWidgetContext = {
    updateConfig: () => {},
    dimensions: () => ({ width: 0, height: 0 }),
    i18n: () => i18n,
  };
  let out = "";
  createRoot((dispose) => {
    createComponent(WidgetCtx.Provider, {
      value: ctx,
      get children() {
        out = read();
        return null;
      },
    });
    dispose();
  });
  return out;
}

describe("formatValue", () => {
  test("writes the formatting locale's decimal mark", () => {
    expect(inWidget("de-DE", () => formatValue(21.5, "°C"))).toBe("21,5°C");
    expect(inWidget("en-US", () => formatValue(21.5, "°C"))).toBe("21.5°C");
  });

  test("scaled and fixed decimals follow the locale too", () => {
    expect(inWidget("de-DE", () => formatValue(1500, "W"))).toBe("1,5kW");
    expect(inWidget("de-DE", () => formatValue(2, "V", { decimals: 2 }))).toBe("2,00V");
    expect(inWidget("en-US", () => formatValue(1500, "W"))).toBe("1.5kW");
  });

  test("a small negative rounds to 0, never -0", () => {
    expect(inWidget("en-US", () => formatValue(-0.001, "W"))).toBe("0W");
    expect(inWidget("en-US", () => formatValue(-0.003, "V", { decimals: 0 }))).toBe("0V");
  });

  test("half-way values round half away from zero, as Intl does", () => {
    expect(inWidget("en-US", () => formatValue(1.005, "V"))).toBe("1.01V");
    expect(inWidget("en-US", () => formatValue(0.15, "V", { decimals: 1 }))).toBe("0.2V");
  });

  test("outside a widget the numbers are English", () => {
    expect(formatValue(21.5, "°C")).toBe("21.5°C");
  });
});
