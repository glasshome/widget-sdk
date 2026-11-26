import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { extractDefaults, toFormSchema } from "../to-form-schema";
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
  const rawTitle = () =>
    z.string().optional().meta({ title: "Title", description: "Optional display name override" });
  const rawArea = () => z.string().optional().meta({ formType: "area-picker", title: "Area" });
  const rawEntities = (domain: string, deviceClass?: string) =>
    z
      .array(z.string())
      .default([])
      .meta({ domain, title: "Entities", ...(deviceClass ? { deviceClass } : {}) });
  const rawEntity = (domain: string, deviceClass?: string) =>
    z
      .array(z.string())
      .default([])
      .meta({
        domain,
        title: "Entity",
        singleSelect: true,
        ...(deviceClass ? { deviceClass } : {}),
      });

  test("title matches raw zod", () => {
    parity(field.title(), rawTitle());
  });

  test("area matches raw zod", () => {
    parity(field.area(), rawArea());
  });

  test("entities matches raw zod", () => {
    parity(field.entities("light"), rawEntities("light"));
    parity(field.entities("sensor", { deviceClass: "power" }), rawEntities("sensor", "power"));
  });

  test("entity matches raw zod", () => {
    parity(field.entity("climate"), rawEntity("climate"));
    parity(field.entity("sensor", { deviceClass: "battery" }), rawEntity("sensor", "battery"));
  });

  test("text (optional) matches raw z.string().optional()", () => {
    parity(field.text({ title: "Label" }), z.string().optional().meta({ title: "Label" }));
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
    const raw = z.object({
      title: z
        .string()
        .optional()
        .meta({ title: "Title", description: "Optional display name override" }),
      areaId: z.string().optional().meta({ formType: "area-picker", title: "Area" }),
    });
    expect(toFormSchema(built)).toEqual(toFormSchema(raw));
    expect(extractDefaults(built)).toEqual(extractDefaults(raw));
  });
});

// ---------------------------------------------------------------------------
// Type-inference parity gate (compile-time; tsc fails the build on mismatch).
// ---------------------------------------------------------------------------

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const areaSchema = defineConfig({ title: field.title(), areaId: field.area() });
type _AreaMatchesRawZod = Expect<
  Equal<
    Infer<typeof areaSchema>,
    z.infer<
      z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        areaId: z.ZodOptional<z.ZodString>;
      }>
    >
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
