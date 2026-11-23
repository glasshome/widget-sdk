import { describe, expect, test } from "bun:test";
import type { StateTexts } from "@glasshome/widget-contract/state-texts";
import { createComponent, createRoot } from "solid-js";
import { type ReactiveWidgetContext, WidgetCtx } from "../hooks/use-widget-context";
import type { WidgetI18n } from "./context";
import { translateState } from "./state";

const states: StateTexts = {
  component: {
    climate: { _: { heat_cool: "Chauffage/climatisation" } },
    binary_sensor: { _: { on: "Activé" }, door: { on: "Ouverte" } },
  },
  entity: {
    acme: { boiler: { state: { heat_cool: "Mode mixte" } } },
  },
};

function inWidget<T>(read: () => T): T {
  const i18n: WidgetI18n = {
    language: "fr",
    formatting: "fr-FR",
    catalog: null,
    sdk: { "sdk.state.unavailable": ["Indisponible"] },
    ui: null,
    states,
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

const climate = (state: string) => ({
  domain: "climate",
  state,
  platform: "generic_thermostat",
  attributes: {},
});

describe("translateState", () => {
  test("reads the domain's text for a state", () => {
    expect(inWidget(() => translateState(climate("heat_cool")))).toBe("Chauffage/climatisation");
  });

  test("reads unavailable from the SDK's own words", () => {
    expect(inWidget(() => translateState(climate("unavailable")))).toBe("Indisponible");
  });

  test("leaves a number for formatNumber", () => {
    expect(inWidget(() => translateState(climate("21.5")))).toBe("21.5");
  });

  test("uses the device class when the entity carries no translation key", () => {
    const door = { domain: "binary_sensor", state: "on", platform: "zha", attributes: {} };
    expect(inWidget(() => translateState({ ...door, deviceClass: "door" }))).toBe("Ouverte");
  });

  test("prefers the entity's own translation key under its platform", () => {
    const boiler = { ...climate("heat_cool"), platform: "acme", translationKey: "boiler" };
    expect(inWidget(() => translateState(boiler))).toBe("Mode mixte");
  });
});
