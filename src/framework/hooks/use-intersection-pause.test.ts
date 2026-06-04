import { describe, expect, test } from "bun:test";
import { useIntersectionPause } from "./use-intersection-pause";

// No `IntersectionObserver` in the bun test env: exercises the SSR-safe fallback.
describe("useIntersectionPause (SSR fallback)", () => {
  test("returns an accessor that reads false", () => {
    const paused = useIntersectionPause(() => undefined);
    expect(typeof paused).toBe("function");
    expect(paused()).toBe(false);
  });
});
