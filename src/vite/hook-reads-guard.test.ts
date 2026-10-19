import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";
import { describe, expect, test } from "bun:test";
import { assertHookReadsDeclared, HOOK_READS } from "./index";

const spaced = `import { Badge as p, useDaylight as pe, useService as O } from "@glasshome/widget-sdk";`;
const sunRead = [{ domain: "sun", access: "read" as const }];

describe("assertHookReadsDeclared", () => {
  test("useDaylight without a sun read fails the build and names the fix", () => {
    expect(() => assertHookReadsDeclared(spaced, [], "area")).toThrow(
      /"area" uses useDaylight\(\), which reads sun\.sun[\s\S]*"domain": "sun", "access": "read"/,
    );
  });

  test("a read of another domain does not cover it", () => {
    expect(() =>
      assertHookReadsDeclared(spaced, [{ domain: "sensor", access: "read" }], "area"),
    ).toThrow();
  });

  test("a namespace import is held to the same rule", () => {
    expect(() =>
      assertHookReadsDeclared(`import*as s from"@glasshome/widget-sdk";`, [], "area"),
    ).toThrow();
  });

  test("a sun read, or sun control, passes", () => {
    expect(() => assertHookReadsDeclared(spaced, sunRead, "area")).not.toThrow();
    expect(() =>
      assertHookReadsDeclared(spaced, [{ domain: "sun", access: "control" }], "area"),
    ).not.toThrow();
  });

  test("a bundle without the hook needs nothing", () => {
    expect(() =>
      assertHookReadsDeclared(`import{Widget}from"@glasshome/widget-sdk";`, [], "clock"),
    ).not.toThrow();
  });
});

describe("HOOK_READS", () => {
  test("lists every entity the SDK reads by a fixed id", () => {
    const src = join(import.meta.dir, "..");
    const fixed = new Set<string>();
    for (const file of new Glob("**/*.{ts,tsx}").scanSync(src)) {
      if (file.includes(".test.")) continue;
      const code = readFileSync(join(src, file), "utf-8");
      for (const [, id] of code.matchAll(/useEntit(?:y|ies)\(\s*["']([a-z_]+\.[a-z0-9_]+)["']/g)) {
        fixed.add(id ?? "");
      }
    }
    expect([...fixed].sort()).toEqual([...new Set(Object.values(HOOK_READS))].sort());
  });
});
