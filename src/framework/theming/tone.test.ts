import { describe, expect, test } from "bun:test";
import { ToneSchema } from "./tone";

describe("ToneSchema", () => {
  test("parses all 6 tones", () => {
    const tones = ["success", "warning", "danger", "info", "neutral", "accent"] as const;
    for (const t of tones) {
      expect(ToneSchema.parse(t)).toBe(t);
    }
  });

  test("rejects unknown tone", () => {
    expect(ToneSchema.safeParse("primary").success).toBe(false);
  });

  test("enum has exactly 6 options", () => {
    expect(ToneSchema.options).toHaveLength(6);
  });
});
