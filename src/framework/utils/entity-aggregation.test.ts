import { expect, test } from "bun:test";
import type { EntityView } from "../types";
import { calculateLightGroup } from "./entity-aggregation";

function light(attributes: Record<string, unknown>, state = "on"): EntityView {
  return {
    id: "light.test",
    domain: "light",
    state,
    attributes,
    lastChanged: new Date(0),
    lastUpdated: new Date(0),
  } as unknown as EntityView;
}

function parseRgb(color: string): [number, number, number] {
  const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) throw new Error(`not an rgb() string: ${color}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

// Regression: HA reports hs_color for many color lights that never carry
// rgb_color. getLightColor / calculateLightGroup used to ignore hs_color and
// fall through to the warm default, so colored lights rendered amber.
test("hs_color light: violet is blue-dominant, not the warm default", () => {
  const violet = calculateLightGroup([light({ brightness: 205, hs_color: [265, 66] })]);
  const [r, g, b] = parseRgb(violet.color);
  // Violet: blue and red present, green low. The warm default (rgb ~255/220/180)
  // has green > blue, so b > g proves hs_color was honored.
  expect(b).toBeGreaterThan(g);
  expect(r).toBeGreaterThan(g);
});

test("hs_color light: teal is green/blue-dominant", () => {
  const teal = calculateLightGroup([light({ brightness: 200, hs_color: [172, 79] })]);
  const [r, g, b] = parseRgb(teal.color);
  expect(g).toBeGreaterThan(r);
  expect(b).toBeGreaterThan(r);
});

test("rgb_color still takes precedence over hs_color", () => {
  const c = calculateLightGroup([
    light({ brightness: 255, rgb_color: [255, 0, 0], hs_color: [120, 100] }),
  ]);
  const [r, g, b] = parseRgb(c.color);
  expect(r).toBe(255);
  expect(g).toBe(0);
  expect(b).toBe(0);
});

test("group averages an hs_color light in with an rgb_color light", () => {
  const group = calculateLightGroup([
    light({ brightness: 255, rgb_color: [255, 0, 0] }),
    light({ brightness: 255, hs_color: [240, 100] }), // pure blue
  ]);
  const [r, g, b] = parseRgb(group.color);
  // Average of red + blue → purple-ish: r and b present, g near zero.
  expect(r).toBeGreaterThan(0);
  expect(b).toBeGreaterThan(0);
  expect(g).toBeLessThan(r);
});
