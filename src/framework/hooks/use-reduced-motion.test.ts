import { describe, expect, test } from "bun:test";
import { useReducedMotion } from "./use-reduced-motion";

// No `window`/`matchMedia` in the bun test env: exercises the SSR-safe fallback.
describe("useReducedMotion (SSR fallback)", () => {
  test("returns an accessor that reads false", () => {
    const reduced = useReducedMotion();
    expect(typeof reduced).toBe("function");
    expect(reduced()).toBe(false);
  });
});
