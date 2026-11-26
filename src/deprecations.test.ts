import { describe, expect, test } from "bun:test";
import { type DeprecationEntry, deprecations, formatDeprecation } from "./deprecations";

const ENTRY: DeprecationEntry = {
  id: "test.symbol",
  since: "1.4.0",
  removeIn: "2.0.0",
  replacement: "field.thing()",
  docsUrl: "https://example.test/docs",
};

describe("formatDeprecation", () => {
  test("renders the one-line notice from a registry entry", () => {
    expect(formatDeprecation(ENTRY)).toBe(
      "[@glasshome/widget-sdk] test.symbol is deprecated since 1.4.0, removed in 2.0.0. Use field.thing(). See https://example.test/docs",
    );
  });
});

describe("registry integrity", () => {
  test("every entry has the required fields and a unique id", () => {
    const ids = new Set<string>();
    for (const d of deprecations) {
      expect(d.id.length).toBeGreaterThan(0);
      expect(d.since).toMatch(/^\d+\.\d+\.\d+$/);
      expect(d.removeIn).toMatch(/^\d+\.\d+\.\d+$/);
      expect(d.replacement.length).toBeGreaterThan(0);
      expect(d.docsUrl).toStartWith("https://");
      expect(ids.has(d.id)).toBe(false);
      ids.add(d.id);
    }
  });

  test("iconify-icon pattern matches both the element and its solid wrapper import", () => {
    const entry = deprecations.find((d) => d.id === "iconify-icon");
    const re = new RegExp(entry?.sourcePattern ?? "$^");
    expect(re.test('import { Icon } from "@iconify-icon/solid";')).toBe(true);
    expect(re.test("import 'iconify-icon';")).toBe(true);
    expect(re.test('import { Icon } from "@glasshome/widget-sdk";')).toBe(false);
  });
});
