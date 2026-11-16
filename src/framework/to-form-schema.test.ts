import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { toFormSchema } from "./to-form-schema";

const configShape = () =>
  z.object({
    title: z.string().default("Kitchen").meta({ title: "Title" }),
    areaId: z.string().optional().meta({ formType: "area-picker", title: "Area" }),
    lights: z.array(z.string()).default([]).meta({ domain: "light", title: "Lights" }),
  });

describe("toFormSchema", () => {
  test("returns the identical object for the same schema object", () => {
    const schema = configShape();
    expect(toFormSchema(schema)).toBe(toFormSchema(schema));
  });

  test("returns separate results for two schema objects of the same shape", () => {
    const first = toFormSchema(configShape());
    const second = toFormSchema(configShape());
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  test("keeps a result unchanged by a later call for another schema", () => {
    const schema = configShape();
    const before = structuredClone(toFormSchema(schema));
    toFormSchema(z.object({ other: z.number() }));
    expect(toFormSchema(schema)).toEqual(before);
  });

  test("injects field metadata into the JSON Schema", () => {
    expect(toFormSchema(configShape())).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        title: { default: "Kitchen", title: "Title", type: "string" },
        areaId: { formType: "area-picker", title: "Area", type: "string" },
        lights: {
          default: [],
          domain: "light",
          title: "Lights",
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["title", "lights"],
      additionalProperties: false,
    });
  });
});
