import { describe, expect, test } from "bun:test";
import { extractDefaults } from "../to-form-schema";
import { defineConfig, field, type Infer } from "./index";

const nodeVariants = () =>
  field.variants(
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

describe("field.list guards", () => {
  test("max is required to be a positive integer", () => {
    expect(() => field.list(nodeVariants(), { title: "Nodes", max: 0 })).toThrow(
      "max must be a positive integer",
    );
    expect(() => field.list(nodeVariants(), { title: "Nodes", max: 2.5 })).toThrow(
      "max must be a positive integer",
    );
  });

  test("max has a hard ceiling of 24", () => {
    expect(() => field.list(nodeVariants(), { title: "Nodes", max: 25 })).toThrow("ceiling of 24");
    expect(() => field.list(nodeVariants(), { title: "Nodes", max: 24 })).not.toThrow();
  });

  test("min must sit between 0 and max", () => {
    expect(() => field.list(nodeVariants(), { title: "Nodes", min: 5, max: 4 })).toThrow(
      "min must be an integer between 0 and max",
    );
    expect(() => field.list(nodeVariants(), { title: "Nodes", min: -1, max: 4 })).toThrow(
      "min must be an integer between 0 and max",
    );
  });

  test("a list item containing another list throws at definition time", () => {
    const inner = field.list(nodeVariants(), { title: "Inner", max: 3 });
    expect(() =>
      field.list(field.group({ inner }, { title: "Wrap" }), { title: "Outer", max: 3 }),
    ).toThrow("depth 1");
    // Also when the nested list hides inside a variants branch.
    const withListVariant = field.variants(
      "kind",
      { a: { inner: field.list(nodeVariants(), { title: "Inner", max: 3 }) } },
      { title: "V" },
    );
    expect(() => field.list(withListVariant, { title: "Outer", max: 3 })).toThrow("depth 1");
  });

  test("labelField must name a field present in every item", () => {
    expect(() =>
      field.list(nodeVariants(), { title: "Nodes", max: 12, labelField: "nope" }),
    ).toThrow('labelField "nope"');
    // "remainder" only exists on the output variant, so it cannot caption every row.
    expect(() =>
      field.list(nodeVariants(), { title: "Nodes", max: 12, labelField: "remainder" }),
    ).toThrow('labelField "remainder"');
    // "label" comes from shared, so it is common to all variants.
    expect(() =>
      field.list(nodeVariants(), { title: "Nodes", max: 12, labelField: "label" }),
    ).not.toThrow();
    // Plain object items resolve labelField against the object shape.
    expect(() =>
      field.list(field.group({ name: field.text({ title: "Name" }) }, { title: "Row" }), {
        title: "Rows",
        max: 4,
        labelField: "name",
      }),
    ).not.toThrow();
  });
});

describe("field.variants guards", () => {
  test("requires at least one variant", () => {
    expect(() => field.variants("kind", {}, { title: "Empty" })).toThrow(
      "at least one variant is required",
    );
  });

  test("shared and variant shapes cannot redefine the discriminator", () => {
    expect(() =>
      field.variants(
        "kind",
        { a: { x: field.toggle({ title: "X" }) } },
        { title: "V", shared: { kind: field.text({ title: "Kind" }) } },
      ),
    ).toThrow('shared fields cannot redefine the discriminator "kind"');
    expect(() =>
      field.variants("kind", { a: { kind: field.text({ title: "Kind" }) } }, { title: "V" }),
    ).toThrow('variant "a" cannot redefine the discriminator "kind"');
  });

  test("labels may only name declared variants", () => {
    expect(() =>
      field.variants(
        "kind",
        { a: { x: field.toggle({ title: "X" }) } },
        { title: "V", labels: { a: "A", b: "B" } as Record<string, string> },
      ),
    ).toThrow('labels names unknown variant "b"');
  });
});

describe("variant-aware default extraction", () => {
  test("a top-level variants field defaults to the first kind with that variant's field defaults", () => {
    // extractDefaults parses {}; without the union-level .default() a
    // discriminated union rejects that (no discriminator). The helper seeds
    // { kind: firstKind } and extracts from that variant's object schema.
    const config = defineConfig({ node: nodeVariants() });
    expect(extractDefaults(config)).toEqual({
      node: { kind: "input", entities: [] },
    });
  });

  test("a config with a list extracts to an empty array", () => {
    const config = defineConfig({
      nodes: field.list(nodeVariants(), { title: "Nodes", min: 2, max: 12, labelField: "label" }),
    });
    expect(extractDefaults(config)).toEqual({ nodes: [] });
  });

  test("parsing still enforces min/max and the discriminator", () => {
    const config = defineConfig({
      nodes: field.list(nodeVariants(), { title: "Nodes", min: 2, max: 3 }),
    });
    expect(() => config.parse({ nodes: [{ kind: "input" }] })).toThrow();
    const two = config.parse({ nodes: [{ kind: "input" }, { kind: "output" }] });
    expect(two.nodes).toEqual([
      { kind: "input", entities: [] },
      { kind: "output", entities: [], remainder: false },
    ]);
    expect(() =>
      config.parse({ nodes: [{ kind: "bogus" }, { kind: "input" }] }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Type-inference gate (compile-time; `typecheck:test` fails the build on drift).
// ---------------------------------------------------------------------------

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
  ? true
  : false;
type Expect<T extends true> = T;

const flowConfig = defineConfig({
  nodes: field.list(nodeVariants(), { title: "Nodes", min: 2, max: 12, labelField: "label" }),
});

type FlowNode = Infer<typeof flowConfig>["nodes"][number];
type ExpectedNode =
  | { kind: "input"; label?: string | undefined; entities: string[] }
  | {
      kind: "output";
      label?: string | undefined;
      entities: string[];
      remainder: boolean;
    };

type _ListProducesArray = Expect<Equal<Infer<typeof flowConfig>["nodes"], ExpectedNode[]>>;
type _VariantsProduceUnion = Expect<Equal<FlowNode, ExpectedNode>>;

// The discriminator narrows: a "kind" check reveals variant-only fields.
type OutputNode = Extract<FlowNode, { kind: "output" }>;
type _NarrowsToOutput = Expect<Equal<OutputNode["remainder"], boolean>>;

// A top-level variants field is a required key with the union type.
const topLevel = defineConfig({ node: nodeVariants() });
type _TopLevelUnion = Expect<Equal<Infer<typeof topLevel>["node"], ExpectedNode>>;

type _Assertions = [_ListProducesArray, _VariantsProduceUnion, _NarrowsToOutput, _TopLevelUnion];

test("type-inference assertions compile", () => {
  const asserted: _Assertions = [true, true, true, true];
  expect(asserted.every(Boolean)).toBe(true);
});

// Runtime narrowing sanity for the union type: the discriminator drives it.
test("parsed nodes narrow on the discriminator", () => {
  const parsed = flowConfig.parse({
    nodes: [{ kind: "input" }, { kind: "output", remainder: true }],
  });
  const remainders = parsed.nodes.filter((n) => n.kind === "output" && n.remainder);
  expect(remainders).toHaveLength(1);
});
