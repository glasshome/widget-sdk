import { describe, expect, test } from "bun:test";
import { svgColors } from "./svg-colors";

describe("svgColors", () => {
  test("every key has non-empty fill/stroke/solid strings", () => {
    for (const entry of Object.values(svgColors)) {
      for (const channel of ["fill", "stroke", "solid"] as const) {
        expect(typeof entry[channel]).toBe("string");
        expect(entry[channel].length).toBeGreaterThan(0);
      }
    }
  });

  test("solar solid carries an oklch value", () => {
    expect(svgColors.solar.solid).toContain("oklch");
  });
});
