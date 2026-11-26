import { createEffect, createMemo, createRoot, flush } from "solid-js";
import { describe, expect, it } from "vitest";
import { createWarmSet, WARM_SHEET_CAP } from "../../src/framework/dialogs/warm-dialogs";

describe("createWarmSet", () => {
  it("holds a key once touched", () => {
    const set = createWarmSet<string>(3);
    expect(set.has("a")).toBe(false);
    set.touch("a");
    expect(set.has("a")).toBe(true);
  });

  it("evicts the least recent key past the cap", () => {
    const set = createWarmSet<string>(3);
    for (const key of ["a", "b", "c", "d"]) set.touch(key);
    expect(["a", "b", "c", "d"].map((key) => set.has(key))).toEqual([false, true, true, true]);
  });

  it("a re-touch makes the key most recent", () => {
    const set = createWarmSet<string>(3);
    for (const key of ["a", "b", "c"]) set.touch(key);
    set.touch("a");
    set.touch("d");
    expect(["a", "b", "c", "d"].map((key) => set.has(key))).toEqual([true, false, true, true]);
  });

  it("a re-touch does not grow the set", () => {
    const set = createWarmSet<string>(2);
    set.touch("a");
    set.touch("a");
    set.touch("b");
    expect(set.has("a")).toBe(true);
    expect(set.has("b")).toBe(true);
  });

  it("drop removes a key and frees its place", () => {
    const set = createWarmSet<string>(2);
    set.touch("a");
    set.touch("b");
    set.drop("a");
    set.touch("c");
    expect(["a", "b", "c"].map((key) => set.has(key))).toEqual([false, true, true]);
  });

  it("dropping an absent key changes nothing", () => {
    const set = createWarmSet<string>(2);
    set.touch("a");
    set.drop("z");
    expect(set.has("a")).toBe(true);
  });

  it("has re-runs a memo on touch, drop and eviction", () => {
    const set = createWarmSet<string>(1);
    const seen: boolean[] = [];
    const dispose = createRoot((dispose) => {
      const warm = createMemo(() => set.has("a"));
      createEffect(warm, (value) => {
        seen.push(value);
      });
      return dispose;
    });
    flush();
    set.touch("a");
    flush();
    set.touch("b");
    flush();
    set.touch("a");
    flush();
    set.drop("a");
    flush();
    dispose();
    expect(seen).toEqual([false, true, false, true, false]);
  });

  it("keys by identity", () => {
    const set = createWarmSet<object>(3);
    const a = {};
    set.touch(a);
    expect(set.has(a)).toBe(true);
    expect(set.has({})).toBe(false);
  });

  it("the sheet cap is three", () => {
    expect(WARM_SHEET_CAP).toBe(3);
  });
});
