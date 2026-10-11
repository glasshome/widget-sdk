import { expect, it, vi } from "vitest";
import { useFakeTime } from "./harness/fake-time";

it("useFakeTime turns fake timers on", () => {
  useFakeTime();
  expect(vi.isFakeTimers()).toBe(true);
});

it("fake time is gone in the next test", () => {
  expect(vi.isFakeTimers()).toBe(false);
});

it("an element reports no running animation", () => {
  expect(getComputedStyle(document.body).animationName).toBe("none");
});
