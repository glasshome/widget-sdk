import { expect, it, vi } from "vitest";
import { useFakeTime } from "./harness/fake-time";

it("useFakeTime fires a timer only when advanced", async () => {
  useFakeTime();
  const fired = vi.fn();
  setTimeout(fired, 300);
  await vi.advanceTimersByTimeAsync(299);
  expect(fired).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(fired).toHaveBeenCalledOnce();
});

it("fake time is gone in the next test", () => {
  expect(vi.isFakeTimers()).toBe(false);
});

it("an element reports no running animation", () => {
  expect(getComputedStyle(document.body).animationName).toBe("none");
});
