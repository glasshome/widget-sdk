import { z, type ZodType } from "zod";

const built = new WeakMap<ZodType, object>();

/**
 * Convert a Zod config schema to JSON Schema with custom metadata injected.
 *
 * Widget field helpers attach metadata via `.meta()` (e.g. `{ domain: "light" }`,
 * `{ formType: "area-picker" }`). The `override` callback reads these from
 * `z.globalRegistry` and merges them into the JSON Schema output so the
 * form renderer can detect custom field types.
 *
 * The conversion runs once per schema object; every caller of the same schema
 * receives the same result, so read it and never change it.
 */
export function toFormSchema(schema: ZodType): object {
  let form = built.get(schema);
  if (!form) {
    form = buildFormSchema(schema);
    built.set(schema, form);
  }
  return form;
}

function buildFormSchema(schema: ZodType): object {
  return z.toJSONSchema(schema, {
    override: (ctx) => {
      const meta = z.globalRegistry.get(ctx.zodSchema);
      if (meta && typeof meta === "object" && Object.keys(meta).length > 0) {
        return { ...ctx.jsonSchema, ...meta };
      }
      return ctx.jsonSchema;
    },
  });
}

/**
 * Extract default config values from a Zod schema.
 * Fields with `.default()` get their default value; optional fields without
 * defaults are omitted. Returns empty object on parse failure.
 */
export function extractDefaults(schema: ZodType): Record<string, unknown> {
  try {
    return schema.parse({}) as Record<string, unknown>;
  } catch {
    return {};
  }
}
