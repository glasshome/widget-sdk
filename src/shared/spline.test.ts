import { describe, expect, test } from "bun:test";
import { monotoneCubicPath } from "./spline";

describe("monotoneCubicPath", () => {
  test("5-point input yields a moveto with cubic segments", () => {
    const points = [
      { x: 0, y: 10 },
      { x: 10, y: 4 },
      { x: 20, y: 8 },
      { x: 30, y: 2 },
      { x: 40, y: 6 },
    ];
    const d = monotoneCubicPath(points);
    expect(d.startsWith("M")).toBe(true);
    expect(d).toContain(" C ");
    // n-1 cubic segments for 5 points
    expect(d.match(/ C /g)?.length).toBe(4);
  });

  test("2-point input is a straight line segment", () => {
    expect(monotoneCubicPath([{ x: 0, y: 0 }, { x: 5, y: 3 }])).toBe("M 0 0 L 5 3");
  });

  test("empty input does not throw and returns empty string", () => {
    expect(monotoneCubicPath([])).toBe("");
  });

  test("single-point input does not throw and returns empty string", () => {
    expect(monotoneCubicPath([{ x: 1, y: 1 }])).toBe("");
  });
});
