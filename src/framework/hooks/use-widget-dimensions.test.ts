import { describe, expect, test } from "bun:test";
import { createComponent, createRoot } from "solid-js";
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
