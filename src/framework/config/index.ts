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
 * SchemaForm renders a flat object plus the nested shapes declared here:
 * `field.group` (one level), `field.list` (array of items, depth 1), and
 * `field.variants` (discriminated union, legal top-level or inside a list).
 */

/** A single config field. Structurally a zod schema producing `T`. */
export type Field<T> = ZodType<T>;

/** A map of field name → field, accepted by `defineConfig` and `field.group`. */
export type ConfigShape = Record<string, ZodType>;

/** Infer a widget's config type from its schema, without naming zod. */
export type Infer<C extends ZodType> = z.infer<C>;

/** Hard ceiling for `field.list` max: each item is a rendered subtree and,
 * typically, an entity subscription (same class of reason previews cap examples). */
const LIST_MAX_ITEMS = 24;

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

/**
 * Icon name (e.g. "mdi:lightbulb"). The host renders its icon picker; the
 * widget only declares that this field is an icon.
 */
function icon(o: { title?: string; default: string }): z.ZodDefault<z.ZodString>;
function icon(o?: { title?: string }): z.ZodOptional<z.ZodString>;
function icon(o?: { title?: string; default?: string }) {
  const base = z.string().meta({ formType: "icon-picker", title: o?.title ?? "Icon" });
  return o?.default !== undefined ? base.default(o.default) : base.optional();
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

type ListOpts = {
  title: string;
  description?: string;
  min?: number;
  max: number;
  addLabel?: string;
  /** Field name whose value captions the collapsed item row. Must exist in
   * every item (for variants: in `shared` or common to all variants). A name,
   * not a function: it has to survive JSON serialization. */
  labelField?: string;
};

type VariantShapes = Record<string, ConfigShape>;

type VariantsOpts<V extends VariantShapes, S extends ConfigShape> = {
  title: string;
  description?: string;
  /** Display names for the discriminator Select, keyed by variant kind. */
  labels?: { [K in keyof V]?: string };
  /** Fields merged into every variant (variant-specific fields win on collision). */
  shared?: S;
};

type VariantsOutput<D extends string, V extends VariantShapes, S extends ConfigShape> = {
  [K in keyof V & string]: z.output<z.ZodObject<{ [P in D]: z.ZodLiteral<K> } & S & V[K]>>;
}[keyof V & string];

/** Structural view of a zod def, for walking nested field trees. */
type WalkableDef = {
  shape?: Record<string, ZodType>;
  options?: readonly ZodType[];
  element?: ZodType;
  innerType?: ZodType;
};

function walkableDef(schema: ZodType): WalkableDef {
  return schema.def as WalkableDef;
}

function containsListField(schema: ZodType): boolean {
  const schemaMeta = z.globalRegistry.get(schema);
  if (schemaMeta?.formType === "list") return true;
  const def = walkableDef(schema);
  if (def.shape) return Object.values(def.shape).some(containsListField);
  if (def.options) return def.options.some(containsListField);
  if (def.element) return containsListField(def.element);
  if (def.innerType) return containsListField(def.innerType);
  return false;
}

function unwrap(schema: ZodType): ZodType {
  let current = schema;
  let inner = walkableDef(current).innerType;
  while (inner) {
    current = inner;
    inner = walkableDef(current).innerType;
  }
  return current;
}

/** Field names present in every possible item shape, or null when the item is
 * not an object/union of objects. */
function itemFieldNames(item: ZodType): ReadonlySet<string> | null {
  const def = walkableDef(unwrap(item));
  if (def.shape) return new Set(Object.keys(def.shape));
  if (def.options) {
    const sets: Array<ReadonlySet<string>> = [];
    for (const option of def.options) {
      const names = itemFieldNames(option);
      if (!names) return null;
      sets.push(names);
    }
    const [first, ...rest] = sets;
    if (!first) return null;
    const common = new Set<string>();
    for (const name of first) {
      if (rest.every((s) => s.has(name))) common.add(name);
    }
    return common;
  }
  return null;
}

/** Defaults for one variant: seed the discriminator, let the object fill field
 * defaults. `extractDefaults` alone parses `{}`, which a discriminated union
 * rejects (no discriminator), so the union carries this as its `.default()`. */
function variantDefaults(
  option: ZodType,
  discriminator: string,
  kind: string,
): Record<string, unknown> {
  const seed = { [discriminator]: kind };
  try {
    return option.parse(seed) as Record<string, unknown>;
  } catch {
    return seed;
  }
}

function list<Item extends ZodType>(item: Item, o: ListOpts): Field<Array<z.output<Item>>> {
  if (!Number.isInteger(o.max) || o.max < 1) {
    throw new Error(`field.list: max must be a positive integer, got ${o.max}`);
  }
  if (o.max > LIST_MAX_ITEMS) {
    throw new Error(`field.list: max ${o.max} exceeds the ceiling of ${LIST_MAX_ITEMS}`);
  }
  if (o.min !== undefined && (!Number.isInteger(o.min) || o.min < 0 || o.min > o.max)) {
    throw new Error(`field.list: min must be an integer between 0 and max, got ${o.min}`);
  }
  if (containsListField(item)) {
    throw new Error("field.list: a list item cannot contain another field.list (depth 1 only)");
  }
  if (o.labelField !== undefined) {
    const names = itemFieldNames(item);
    if (!names?.has(o.labelField)) {
      throw new Error(
        `field.list: labelField "${o.labelField}" must name a field present in every item`,
      );
    }
  }
  let arr = z.array(item);
  if (o.min !== undefined) arr = arr.min(o.min);
  arr = arr.max(o.max);
  const base: ZodType = arr;
  return base.default([]).meta(
    meta({
      formType: "list",
      title: o.title,
      description: o.description,
      addLabel: o.addLabel,
      labelField: o.labelField,
    }),
  ) as Field<Array<z.output<Item>>>;
}

function variants<
  D extends string,
  V extends VariantShapes,
  S extends ConfigShape = Record<never, never>,
>(discriminator: D, variantShapes: V, o: VariantsOpts<V, S>): Field<VariantsOutput<D, V, S>> {
  const kinds = Object.keys(variantShapes);
  const firstKind = kinds[0];
  if (firstKind === undefined) {
    throw new Error("field.variants: at least one variant is required");
  }
  if (o.shared && discriminator in o.shared) {
    throw new Error(`field.variants: shared fields cannot redefine the discriminator "${discriminator}"`);
  }
  for (const [kind, shape] of Object.entries(variantShapes)) {
    if (discriminator in shape) {
      throw new Error(
        `field.variants: variant "${kind}" cannot redefine the discriminator "${discriminator}"`,
      );
    }
  }
  if (o.labels) {
    for (const labelKind of Object.keys(o.labels)) {
      if (!(labelKind in variantShapes)) {
        throw new Error(`field.variants: labels names unknown variant "${labelKind}"`);
      }
    }
  }
  // The literal comes last so no spread can shadow it (guards above make that a
  // hard error anyway, with a better message).
  const optionSchemas = Object.entries(variantShapes).map(([kind, shape]) =>
    z.object({ ...(o.shared ?? {}), ...shape, [discriminator]: z.literal(kind) }),
  );
  // Options are built with computed keys, so TS cannot see the discriminator
  // literal statically; the guards above make it a runtime invariant.
  const union = z.discriminatedUnion(
    discriminator,
    optionSchemas as unknown as readonly [
      z.core.$ZodTypeDiscriminable<D>,
      ...z.core.$ZodTypeDiscriminable<D>[],
    ],
  );
  const firstOption = optionSchemas[0];
  const base: ZodType = union;
  return base
    .default(firstOption ? variantDefaults(firstOption, discriminator, firstKind) : {})
    .meta(
      meta({
        formType: "variants",
        discriminator,
        title: o.title,
        description: o.description,
        labels: o.labels,
      }),
    ) as Field<VariantsOutput<D, V, S>>;
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
  icon,
  stringList,
  group,
  list,
  variants,
};

export function defineConfig<S extends ConfigShape>(shape: S) {
  return z.object(shape);
}
