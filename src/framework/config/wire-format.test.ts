import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { toFormSchema } from "../to-form-schema";
import { defineConfig, field } from "./index";

/**
 * Serialization spike (sdk-2.md D.2, plan step 2): does `.meta()` survive zod's
 * JSON Schema conversion inside `oneOf` branches and array `items`, in BOTH
 * serializers?
 *
 * Findings on zod 4.4.3 (the resolved version; spec floor is >=4.1.13):
 *
 * 1. Meta survives everywhere it is needed. `formType`/`addLabel`/`labelField`
 *    land on the array schema, `formType`/`discriminator`/`labels` land on the
 *    union schema inside `items`, and `domain`/`deviceClass` land on entity
 *    fields inside each `oneOf` branch. Verified for both serializers below.
 *
 * 2. Which consumer uses which serializer:
 *    - `defineWidget` calls `toFormSchema` (the override wrapper in
 *      ../to-form-schema.ts) to fill `manifest.schema`, which dash's
 *      SchemaForm consumes directly.
 *    - the vite build's introspection step (`src/vite/introspect.ts`) calls raw
 *      `z.toJSONSchema(schema, { unrepresentable: "any" })` for the manifest
 *      payload the Hub stores.
 *
 * 3. The override in `toFormSchema` is REDUNDANT on zod 4.4.3: raw
 *    `z.toJSONSchema` already merges `z.globalRegistry` metadata into the
 *    output, including for schemas nested in `items` and union options (the
 *    equality test below proves the two outputs identical). The wrapper is kept
 *    because it is the published API `defineWidget` uses and it hard-pins the
 *    behavior if a future zod stops merging registry meta by default.
 *
 * 4. zod serializes a discriminated union as `oneOf` (matching spec D.2, not
 *    `anyOf`), and `z.literal(kind)` as `const: kind`.
 */

function flowConfig() {
  const node = field.variants(
    "kind",
    {
      input: { entities: field.entities("sensor", { deviceClass: "power" }) },
      output: {
        entities: field.entities("sensor", { deviceClass: "power" }),
        remainder: field.toggle({ title: "Remainder node" }),
      },
    },
    {
      title: "Node type",
      labels: { input: "Input", output: "Output" },
      shared: { label: field.text({ title: "Label" }) },
    },
  );
  return defineConfig({
    nodes: field.list(node, {
      title: "Flow nodes",
      min: 2,
      max: 12,
      addLabel: "Add node",
      labelField: "label",
    }),
  });
}

/** The introspect serializer, verbatim from src/vite/introspect.ts. */
function introspectSerialize(schema: z.ZodType): object {
  return z.toJSONSchema(schema, { unrepresentable: "any" });
}

const sharedLabel = { title: "Label", type: "string" };
const powerEntities = {
  default: [],
  domain: "sensor",
  deviceClass: "power",
  title: "Entities",
  type: "array",
  items: { type: "string" },
};

/** Wire shape from spec D.2: list of variants. */
const expectedListOfVariants = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    nodes: {
      minItems: 2,
      maxItems: 12,
      type: "array",
      items: {
        oneOf: [
          {
            type: "object",
            properties: {
              label: sharedLabel,
              entities: powerEntities,
              kind: { type: "string", const: "input" },
            },
            required: ["entities", "kind"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              label: sharedLabel,
              entities: powerEntities,
              remainder: { default: false, title: "Remainder node", type: "boolean" },
              kind: { type: "string", const: "output" },
            },
            required: ["entities", "remainder", "kind"],
            additionalProperties: false,
          },
        ],
        // Variant-aware default: first kind seeded, that variant's defaults extracted.
        default: { kind: "input", entities: [] },
        formType: "variants",
        discriminator: "kind",
        title: "Node type",
        labels: { input: "Input", output: "Output" },
      },
      default: [],
      formType: "list",
      title: "Flow nodes",
      addLabel: "Add node",
      labelField: "label",
    },
  },
  required: ["nodes"],
  additionalProperties: false,
};

describe("wire format (spec D.2)", () => {
  test("toFormSchema: meta survives inside items and oneOf branches", () => {
    expect(toFormSchema(flowConfig())).toEqual(expectedListOfVariants);
  });

  test("introspect's raw z.toJSONSchema: identical output, so meta survives there too", () => {
    const raw = introspectSerialize(flowConfig());
    expect(raw).toEqual(expectedListOfVariants);
    expect(raw).toEqual(toFormSchema(flowConfig()) as typeof raw);
  });

  test("top-level variants field (conditional-visibility shape)", () => {
    const config = defineConfig({
      mode: field.variants(
        "kind",
        {
          simple: { entity: field.entity("sensor") },
          advanced: { formula: field.text({ title: "Formula" }) },
        },
        { title: "Mode", labels: { simple: "Simple", advanced: "Advanced" } },
      ),
    });
    const wire = toFormSchema(config) as {
      properties: { mode: Record<string, unknown> };
    };
    expect(wire.properties.mode.formType).toBe("variants");
    expect(wire.properties.mode.discriminator).toBe("kind");
    expect(wire.properties.mode.labels).toEqual({ simple: "Simple", advanced: "Advanced" });
    expect(Array.isArray(wire.properties.mode.oneOf)).toBe(true);
    // singleSelect entity meta survives inside the branch.
    const branches = wire.properties.mode.oneOf as Array<{
      properties: Record<string, Record<string, unknown>>;
    }>;
    const simple = branches.find((b) => b.properties.kind?.const === "simple");
    expect(simple?.properties.entity?.domain).toBe("sensor");
    expect(simple?.properties.entity?.singleSelect).toBe(true);
  });
});
