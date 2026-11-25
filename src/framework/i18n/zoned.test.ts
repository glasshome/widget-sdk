import { describe, expect, test } from "bun:test";
import { zonedTime } from "./format";

describe("zonedTime", () => {
  test("zonedTime reads the hour in the zone it is given", () => {
    const moment = Date.UTC(2026, 10, 2, 23, 30);
    expect(zonedTime(moment, "Europe/Berlin")).toEqual({
      year: 2026,
      month: 11,
      day: 3,
      hour: 0,
      minute: 30,
      second: 0,
      weekday: 2,
    });
    const newYork = zonedTime(moment, "America/New_York");
    expect(newYork.hour).toBe(18);
    expect(newYork.day).toBe(2);
  });

  test("midnight is hour 0", () => {
    expect(zonedTime(Date.UTC(2026, 0, 1, 0, 0), "UTC").hour).toBe(0);
  });

  test("an empty or unknown zone reads the device zone", () => {
    const moment = Date.UTC(2026, 10, 2, 23, 30);
    const device = zonedTime(moment);
    expect(zonedTime(moment, "")).toEqual(device);
    expect(zonedTime(moment, "Not/AZone")).toEqual(device);
  });
});
