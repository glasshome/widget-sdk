import { describe, expect, test } from "bun:test";
import { daylightFrom } from "./use-daylight";

const at = (hour: number) => new Date(2026, 5, 15, hour, 30);

describe("daylightFrom with sun.sun", () => {
  test("above the horizon is day", () => {
    expect(daylightFrom({ state: "above_horizon", elevation: 30 }, at(3)).phase).toBe("day");
  });
  test("just below the horizon while setting is dusk", () => {
    expect(daylightFrom({ state: "below_horizon", elevation: -3, rising: false }, at(12)).phase).toBe("dusk");
  });
  test("just below the horizon while rising is dawn", () => {
    expect(daylightFrom({ state: "below_horizon", elevation: -3, rising: true }, at(12)).phase).toBe("dawn");
  });
  test("past civil twilight is night", () => {
    const d = daylightFrom({ state: "below_horizon", elevation: -12 }, at(12));
    expect(d.phase).toBe("night");
    expect(d.isNight).toBe(true);
    expect(d.elevation).toBe(-12);
  });
  test("below the horizon with no elevation is night", () => {
    expect(daylightFrom({ state: "below_horizon" }, at(12)).phase).toBe("night");
  });
  test("an unavailable sun falls back to the clock", () => {
    expect(daylightFrom({ state: "unavailable" }, at(23)).phase).toBe("night");
  });
});

describe("daylightFrom without sun.sun", () => {
  test("evening and early morning are night", () => {
    expect(daylightFrom(undefined, at(20)).isNight).toBe(true);
    expect(daylightFrom(undefined, at(6)).isNight).toBe(true);
  });
  test("daytime hours are day", () => {
    expect(daylightFrom(undefined, at(7)).phase).toBe("day");
    expect(daylightFrom(undefined, at(19)).phase).toBe("day");
  });
  test("carries no elevation", () => {
    expect(daylightFrom(undefined, at(12)).elevation).toBeUndefined();
  });
});

describe("daylightFrom progress", () => {
  const iso = (h: number, m = 0, day = 15) => new Date(2026, 5, day, h, m).toISOString();
  test("runs from sunrise to sunset while the sun is up", () => {
    const sun = {
      state: "above_horizon",
      elevation: 40,
      next_rising: iso(5, 0, 16),
      next_setting: iso(21, 0),
    };
    expect(daylightFrom(sun, new Date(2026, 5, 15, 13, 0)).progress).toBeCloseTo(0.5, 2);
  });
  test("runs from sunset to sunrise overnight", () => {
    const sun = {
      state: "below_horizon",
      elevation: -20,
      next_rising: iso(5, 0, 16),
      next_setting: iso(21, 0, 16),
    };
    expect(daylightFrom(sun, new Date(2026, 5, 16, 1, 0)).progress).toBeCloseTo(0.5, 2);
  });
  test("is undefined without the sun's times", () => {
    expect(daylightFrom({ state: "above_horizon", elevation: 30 }, at(12)).progress).toBeUndefined();
    expect(daylightFrom(undefined, at(12)).progress).toBeUndefined();
  });
});
