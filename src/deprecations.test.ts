import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import {
  _resetDeprecationWarnings,
  deprecate,
  type DeprecationEntry,
  deprecations,
  formatDeprecation,
} from "./deprecations";
import { widgetFields } from "./framework/fields";

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

describe("deprecate()", () => {
  let warnSpy: ReturnType<typeof spyOn>;
  const prevEnv = process.env.NODE_ENV;

  beforeEach(() => {
    _resetDeprecationWarnings();
    warnSpy = spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
    process.env.NODE_ENV = prevEnv;
  });

  test("preserves signature and return value", () => {
    const wrapped = deprecate((a: number, b: number) => a + b, "widgetFields.title");
    process.env.NODE_ENV = "development";
    expect(wrapped(2, 3)).toBe(5);
  });

  test("warns once per id in dev, then stays silent", () => {
    process.env.NODE_ENV = "development";
    const wrapped = deprecate(() => 1, "widgetFields.title");
    wrapped();
    wrapped();
    wrapped();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("widgetFields.title is deprecated");
  });

  test("is silent in production", () => {
    process.env.NODE_ENV = "production";
    const wrapped = deprecate(() => 1, "widgetFields.areaId");
    wrapped();
    wrapped();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test("does not warn for an id missing from the registry", () => {
    process.env.NODE_ENV = "development";
    const wrapped = deprecate(() => 1, "not.in.registry");
    wrapped();
    expect(warnSpy).not.toHaveBeenCalled();
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

  test("covers every widgetFields symbol + the raw-zod config pattern", () => {
    const ids = deprecations.map((d) => d.id);
    for (const key of Object.keys(widgetFields)) {
      expect(ids).toContain(`widgetFields.${key}`);
    }
    expect(ids).toContain("raw-zod-config");
  });
});

describe("widgetFields runtime is wrapped and still works", () => {
  const prevEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = prevEnv;
  });

  test("wrapped helper warns in dev but returns a working schema", () => {
    _resetDeprecationWarnings();
    const spy = spyOn(console, "warn").mockImplementation(() => {});
    process.env.NODE_ENV = "development";
    const schema = widgetFields.title();
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
