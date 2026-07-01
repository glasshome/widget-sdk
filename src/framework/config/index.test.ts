import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { extractDefaults, toFormSchema } from "../to-form-schema";
import { widgetFields } from "../fields";
import { defineConfig, field, type Infer } from "./index";

/**
 * Parity gate: every `field.*` must produce byte-identical JSON Schema + defaults
 * to the raw-zod pattern it replaces (per the usage-inventory table). Migration is
 * safe only if these match, so each case builds the schema both ways and compares
 * the two pipeline outputs SchemaForm/defineWidget actually consume.
 */

function parity(built: z.ZodType, raw: z.ZodType) {
  expect(toFormSchema(built)).toEqual(toFormSchema(raw));
  expect(extractDefaults(z.object({ x: built }))).toEqual(extractDefaults(z.object({ x: raw })));
}

describe("field.* JSON-schema + default parity vs raw zod", () => {
  test("title matches widgetFields.title", () => {
    parity(field.title(), widgetFields.title());
  });

  test("area matches widgetFields.areaId", () => {
    parity(field.area(), widgetFields.areaId());
  });

  test("entities matches widgetFields.entityIds", () => {
    parity(field.entities("light"), widgetFields.entityIds("light"));
    parity(
      field.entities("sensor", { deviceClass: "power" }),
      widgetFields.entityIds("sensor", { deviceClass: "power" }),
    );
  });

  test("entity matches widgetFields.singleEntity", () => {
    parity(field.entity("climate"), widgetFields.singleEntity("climate"));
    parity(
      field.entity("sensor", { deviceClass: "battery" }),
      widgetFields.singleEntity("sensor", { deviceClass: "battery" }),
    );
  });

  test("text (optional) matches raw z.string().optional()", () => {
    parity(
      field.text({ title: "Label" }),
      z.string().optional().meta({ title: "Label" }),
    );
  });

  test("text (with default) matches raw z.string().default()", () => {
    parity(
      field.text({ title: "Label", default: "hi" }),
      z.string().default("hi").meta({ title: "Label" }),
    );
  });

  test("number matches raw z.number().min().max().default()", () => {
    parity(
      field.number({ title: "Size", min: 1, max: 10, default: 5 }),
      z.number().min(1).max(10).default(5).meta({ title: "Size" }),
    );
  });

  test("toggle matches raw z.boolean().default(false)", () => {
    parity(
      field.toggle({ title: "Show Seconds" }),
      z.boolean().default(false).meta({ title: "Show Seconds" }),
    );
    parity(
      field.toggle({ title: "Enabled", default: true }),
      z.boolean().default(true).meta({ title: "Enabled" }),
    );
  });

  test("choice matches raw z.enum().default()", () => {
    parity(
      field.choice(["digital", "analog", "square"], { title: "Clock Style", default: "digital" }),
      z.enum(["digital", "analog", "square"]).default("digital").meta({ title: "Clock Style" }),
    );
  });

  test("stringList matches raw z.array(z.string()).default([])", () => {
    parity(
      field.stringList({ title: "Items" }),
      z.array(z.string()).default([]).meta({ title: "Items" }),
    );
  });

  test("group (clock analogOptions) matches raw nested z.object().default()", () => {
    const built = field.group(
      {
        border: field.toggle({ title: "Show Border", default: false }),
        ticks: field.choice(["none", "quarter", "hour", "minute"], {
          title: "Tick Marks",
          default: "hour",
        }),
      },
      { title: "Analog Options" },
    );
    const raw = z
      .object({
        border: z.boolean().default(false).meta({ title: "Show Border" }),
        ticks: z
          .enum(["none", "quarter", "hour", "minute"])
          .default("hour")
          .meta({ title: "Tick Marks" }),
      })
      .default({ border: false, ticks: "hour" })
      .meta({ title: "Analog Options" });
    parity(built, raw);
  });
});

describe("defineConfig whole-schema parity", () => {
  test("area widget schema (title + area)", () => {
    const built = defineConfig({ title: field.title(), areaId: field.area() });
    const raw = z.object({ title: widgetFields.title(), areaId: widgetFields.areaId() });
    expect(toFormSchema(built)).toEqual(toFormSchema(raw));
    expect(extractDefaults(built)).toEqual(extractDefaults(raw));
  });
});

// ---------------------------------------------------------------------------
// Type-inference parity gate (compile-time; tsc fails the build on mismatch).
// ---------------------------------------------------------------------------

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
  ? true
  : false;
type Expect<T extends true> = T;

const areaSchema = defineConfig({ title: field.title(), areaId: field.area() });
type _AreaMatchesRawZod = Expect<
  Equal<
    Infer<typeof areaSchema>,
    z.infer<z.ZodObject<{ title: ReturnType<typeof widgetFields.title>; areaId: ReturnType<typeof widgetFields.areaId> }>>
  >
>;

const mixedSchema = defineConfig({
  name: field.text({ title: "Name" }),
  count: field.number({ title: "Count", default: 3 }),
  enabled: field.toggle({ title: "On" }),
  style: field.choice(["a", "b", "c"], { title: "Style", default: "a" }),
  ids: field.entities("light"),
});
type _MixedExact = Expect<
  Equal<
    Infer<typeof mixedSchema>,
    {
      name?: string | undefined;
      count: number;
      enabled: boolean;
      style: "a" | "b" | "c";
      ids: string[];
    }
  >
>;

// choice preserves the literal union, not widened to string
type _ChoiceLiteral = Expect<Equal<Infer<typeof mixedSchema>["style"], "a" | "b" | "c">>;

// number without a default is optional; with a default it is required
const optNum = defineConfig({ n: field.number({ title: "N" }) });
type _OptionalNumber = Expect<Equal<Infer<typeof optNum>["n"], number | undefined>>;

// Each `type _X = Expect<Equal<...>>` above is `true` only when inference matches;
// on drift it resolves to a tsc error under `typecheck:test`. Reference them here so
// the aliases are not flagged unused.
type _Assertions = [_AreaMatchesRawZod, _MixedExact, _ChoiceLiteral, _OptionalNumber];

test("type-inference assertions compile", () => {
  const asserted: _Assertions = [true, true, true, true];
  expect(asserted.every(Boolean)).toBe(true);
});
