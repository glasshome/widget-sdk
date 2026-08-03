import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { validateConfigDraft } from "./validate-config";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  nodes: z
    .array(
      z.object({
        label: z.string(),
        remainder: z.boolean(),
      }),
    )
    .check((ctx) => {
      const remainders = ctx.value.filter((n) => n.remainder).length;
      if (remainders > 1) {
        ctx.issues.push({
          code: "custom",
          message: "At most one remainder node",
          input: ctx.value,
        });
      }
    }),
});

describe("validateConfigDraft", () => {
  test("returns null for a valid draft", () => {
    expect(
      validateConfigDraft(schema, {
        title: "Energy",
        nodes: [{ label: "Solar", remainder: true }],
      }),
    ).toBeNull();
  });

  test("formats field issues as path: message", () => {
    const errors = validateConfigDraft(schema, {
      title: "",
      nodes: [{ label: "Solar", remainder: false }],
    });
    expect(errors).toEqual(["title: Title is required"]);
  });

  test("cross-item rules land at the list path", () => {
    const errors = validateConfigDraft(schema, {
      title: "Energy",
      nodes: [
        { label: "a", remainder: true },
        { label: "b", remainder: true },
      ],
    });
    expect(errors).toEqual(["nodes: At most one remainder node"]);
  });

  test("indexes into list items read as nodes[n].field", () => {
    const errors = validateConfigDraft(schema, {
      title: "Energy",
      nodes: [{ label: "a", remainder: false }, { remainder: false }],
    });
    expect(errors?.some((e) => e.startsWith("nodes[1].label: "))).toBe(true);
  });

  test("root-level issues carry no path prefix", () => {
    const rootSchema = z.object({ a: z.string() }).check((ctx) => {
      ctx.issues.push({ code: "custom", message: "root problem", input: ctx.value });
    });
    expect(validateConfigDraft(rootSchema, { a: "x" })).toEqual(["root problem"]);
  });
});
