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
