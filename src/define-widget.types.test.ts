import { expectTypeOf, test } from "bun:test";
import type { BundledCatalog } from "@glasshome/widget-contract/i18n-format";
import type { defineWidget } from "./define-widget";
import type { WidgetDefinition } from "./types";

const manifest = {
  name: "hello",
  minSize: { w: 1, h: 1 },
  maxSize: { w: 2, h: 2 },
  sdkVersion: "^1.34.0",
};

test("messages takes a plain locale JSON import as TypeScript sees it", () => {
  const typesOnly = (define: typeof defineWidget, en: Readonly<Record<string, string>>) =>
    define({ manifest, messages: en, component: () => null });
  expectTypeOf(typesOnly).toBeFunction();
  expectTypeOf<Readonly<Record<string, string>>>().toExtend<
    NonNullable<WidgetDefinition["messages"]>
  >();
  expectTypeOf<{ hi: string; "rooms.count": string }>().toExtend<
    NonNullable<WidgetDefinition["messages"]>
  >();
});

test("messages takes the bundled catalog the build compiles", () => {
  expectTypeOf<BundledCatalog>().toExtend<NonNullable<WidgetDefinition["messages"]>>();
});

test("messages refuses values that are not text", () => {
  const typesOnly = (define: typeof defineWidget) =>
    // @ts-expect-error a locale file holds only strings
    define({ manifest, messages: { hi: 1 }, component: () => null });
  expectTypeOf(typesOnly).toBeFunction();
});
