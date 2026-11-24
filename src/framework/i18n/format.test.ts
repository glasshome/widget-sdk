import { describe, expect, test } from "bun:test";
import { createComponent, createRoot } from "solid-js";
import { type ReactiveWidgetContext, WidgetCtx } from "../hooks/use-widget-context";
import type { WidgetI18n } from "./context";
import { formatDate, formatNumber, formatRelative, formatTemperature } from "./format";

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

describe("formatNumber", () => {
  test("writes the formatting locale's decimal mark", () => {
    expect(inWidget("de-DE", () => formatNumber(21.5))).toBe("21,5");
    expect(inWidget("en-US", () => formatNumber(21.5))).toBe("21.5");
  });

  test("refuses to run outside a widget", () => {
    expect(() => formatNumber(21.5)).toThrow("formatNumber() must run inside a widget");
  });
});

describe("formatTemperature", () => {
  test("writes the number in the formatting locale beside its unit", () => {
    expect(inWidget("fr-FR", () => formatTemperature(21.5))).toBe("21,5 °C");
  });

  test("keeps the unit it was given and never converts", () => {
    expect(inWidget("en-US", () => formatTemperature(70.7, { unit: "°F" }))).toBe("70.7 °F");
  });

  test("a small negative that rounds to zero shows 0, never -0", () => {
    expect(inWidget("en-US", () => formatTemperature(-0.3, { digits: 0 }))).toBe("0 °C");
    expect(inWidget("fr-FR", () => formatTemperature(-0.04, { digits: 1 }))).toBe("0,0 °C");
    expect(inWidget("en-US", () => formatTemperature(-2.4, { digits: 0 }))).toBe("-2 °C");
  });
});

describe("formatDate", () => {
  test("writes a date in the formatting locale", () => {
    const date = new Date(Date.UTC(2026, 10, 3));
    expect(
      inWidget("de-DE", () =>
        formatDate(date, { day: "numeric", month: "short", timeZone: "UTC" }),
      ),
    ).toBe("3. Nov.");
  });
});

describe("formatRelative", () => {
  test("writes a relative time in the formatting locale", () => {
    expect(inWidget("fr-FR", () => formatRelative(-1, "day", { numeric: "auto" }))).toBe("hier");
  });
});
