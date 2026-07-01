import { z, type ZodType } from "zod";
import { extractDefaults } from "../to-form-schema";

/**
 * Widget config API: declare a widget's configSchema without importing zod.
 *
 * `field.*` produce config fields; `defineConfig` composes them into a schema
 * accepted by `defineWidget.configSchema` and rendered by SchemaForm. zod stays a
 * hidden implementation detail (a field IS a zod schema, but widgets never name it).
 * For refinements/unions the API can't express, the raw `z` re-export is the escape
 * hatch (couples the widget to the SDK's zod version).
 *
 * Fields return their concrete zod schema type (`ZodOptional`/`ZodDefault`/…) rather
 * than an erased `Field<T>`, because `z.object` reads that brand to decide whether a
 * key is optional. Erasing it silently diverges `Infer` from raw `z.infer` (a key
 * becomes `x: T | undefined` instead of `x?: T`), so the concrete types are load-bearing.
 *
 * SchemaForm renders a FLAT object only; `field.group` is the sole nested exception.
 */

/** A single config field. Structurally a zod schema producing `T`. */
export type Field<T> = ZodType<T>;

/** A map of field name → field, accepted by `defineConfig` and `field.group`. */
export type ConfigShape = Record<string, ZodType>;

/** Infer a widget's config type from its schema, without naming zod. */
export type Infer<C extends ZodType> = z.infer<C>;

type TextOpts = { title: string; description?: string; default?: string };
type NumberOpts = {
  title: string;
  description?: string;
  min?: number;
  max?: number;
  default?: number;
};
type ToggleOpts = { title: string; description?: string; default?: boolean };
type ChoiceOpts<T extends string> = { title: string; description?: string; default?: T };
type EntitiesOpts = { title?: string; description?: string; deviceClass?: string };

/** Drop `undefined` values so meta output matches a hand-written `.meta({...})`. */
function meta(entries: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function title(): z.ZodOptional<z.ZodString> {
  return z
    .string()
    .optional()
    .meta({ title: "Title", description: "Optional display name override" });
}

function text(o: TextOpts & { default: string }): z.ZodDefault<z.ZodString>;
function text(o: TextOpts): z.ZodOptional<z.ZodString>;
function text(o: TextOpts): z.ZodDefault<z.ZodString> | z.ZodOptional<z.ZodString> {
  const base = o.default !== undefined ? z.string().default(o.default) : z.string().optional();
  return base.meta(meta({ title: o.title, description: o.description }));
}

function number(o: NumberOpts & { default: number }): z.ZodDefault<z.ZodNumber>;
function number(o: NumberOpts): z.ZodOptional<z.ZodNumber>;
function number(o: NumberOpts): z.ZodDefault<z.ZodNumber> | z.ZodOptional<z.ZodNumber> {
  let base = z.number();
  if (o.min !== undefined) base = base.min(o.min);
  if (o.max !== undefined) base = base.max(o.max);
  const withDefault = o.default !== undefined ? base.default(o.default) : base.optional();
  return withDefault.meta(meta({ title: o.title, description: o.description }));
}

function toggle(o: ToggleOpts): z.ZodDefault<z.ZodBoolean> {
  return z
    .boolean()
    .default(o.default ?? false)
    .meta(meta({ title: o.title, description: o.description }));
}

function choice<const T extends string>(
  values: readonly T[],
  o: ChoiceOpts<T> & { default: T },
): z.ZodDefault<z.ZodEnum<{ [K in T]: K }>>;
function choice<const T extends string>(
  values: readonly T[],
  o: ChoiceOpts<T>,
): z.ZodOptional<z.ZodEnum<{ [K in T]: K }>>;
function choice<const T extends string>(
  values: readonly T[],
  o: ChoiceOpts<T>,
): z.ZodDefault<z.ZodEnum<{ [K in T]: K }>> | z.ZodOptional<z.ZodEnum<{ [K in T]: K }>> {
  const base = z.enum(values as unknown as [T, ...T[]]);
  const withDefault = o.default !== undefined ? base.default(o.default) : base.optional();
  return withDefault.meta(meta({ title: o.title, description: o.description }));
}

function entities(domain: string, o?: EntitiesOpts): z.ZodDefault<z.ZodArray<z.ZodString>> {
  return z
    .array(z.string())
    .default([])
    .meta(
      meta({
        domain,
        title: o?.title ?? "Entities",
        description: o?.description,
        deviceClass: o?.deviceClass,
      }),
    );
}

function entity(domain: string, o?: EntitiesOpts): z.ZodDefault<z.ZodArray<z.ZodString>> {
  return z
    .array(z.string())
    .default([])
    .meta(
      meta({
        domain,
        title: o?.title ?? "Entity",
        description: o?.description,
        deviceClass: o?.deviceClass,
        singleSelect: true,
      }),
    );
}

function area(o?: { title?: string }): z.ZodOptional<z.ZodString> {
  return z
    .string()
    .optional()
    .meta({ formType: "area-picker", title: o?.title ?? "Area" });
}

function stringList(o: { title: string; description?: string }): z.ZodDefault<z.ZodArray<z.ZodString>> {
  return z
    .array(z.string())
    .default([])
    .meta(meta({ title: o.title, description: o.description }));
}

function group<S extends ConfigShape>(
  shape: S,
  o: { title: string },
): Field<{ [K in keyof S]: Infer<S[K]> }> {
  const obj = z.object(shape);
  // Nested defaults are collected from the inner fields so `extractDefaults` on the
  // parent still yields the group's populated shape (parity with a hand-written
  // `z.object({...}).default({...})`). zod's generic object-default inference can't
  // see through S, so apply the default via the erased base type and re-assert the
  // precise field type on exit. A group is always a present (required) key, so the
  // `Field<T>` erasure does not affect optionality here.
  const base: ZodType = obj;
  return base
    .default(extractDefaults(obj))
    .meta({ title: o.title }) as Field<{ [K in keyof S]: Infer<S[K]> }>;
}

export const field = {
  title,
  text,
  number,
  toggle,
  choice,
  entities,
  entity,
  area,
  stringList,
  group,
};

export function defineConfig<S extends ConfigShape>(shape: S) {
  return z.object(shape);
}
