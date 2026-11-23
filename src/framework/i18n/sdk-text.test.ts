import { describe, expect, test } from "bun:test";
import { createComponent, createRoot } from "solid-js";
import { loadSdkCatalog } from "../../host/sdk-catalog";
import { type ReactiveWidgetContext, WidgetCtx } from "../hooks/use-widget-context";
import type { EntityView } from "../types";
import { calculateSensorGroup } from "../utils/entity-aggregation";
import { interpretValue } from "../utils/interpret-value";
import type { WidgetI18n } from "./context";

async function inFrench<T>(read: () => T): Promise<T> {
  const i18n: WidgetI18n = {
    language: "fr",
    formatting: "fr-FR",
    catalog: null,
    sdk: await loadSdkCatalog("fr"),
    ui: null,
    states: null,
  };
  const ctx: ReactiveWidgetContext = {
    updateConfig: () => {},
    dimensions: () => ({ width: 0, height: 0 }),
    i18n: () => i18n,
  };
  let out: T | undefined;
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
  return out as T;
}

const sensor = (id: string, state: string) =>
  ({ id, state, attributes: {} }) as unknown as EntityView;

describe("the SDK's words", () => {
  test("a sensor group describes itself in the member's language", async () => {
    const result = await inFrench(() =>
      calculateSensorGroup([sensor("a", "20"), sensor("b", "22"), sensor("c", "21")], "max"),
    );
    expect(result.description).toBe("Maximum sur 3");
  });

  test("an interpreted value is a word of the member's language", async () => {
    expect(await inFrench(() => interpretValue(5, "°C"))).toBe("Froid");
  });

  test("English with no widget around it", () => {
    expect(interpretValue(5, "°C")).toBe("Cold");
    expect(calculateSensorGroup([sensor("a", "1"), sensor("b", "2")], "max").description).toBe(
      "Maximum of 2",
    );
  });
});
