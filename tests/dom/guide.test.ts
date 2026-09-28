import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as sdk from "../../src";
import { Widget } from "../../src/framework/core/Widget";

const guide = readFileSync(resolve(import.meta.dirname, "../../guide/widgets.md"), "utf-8");
const code = [...guide.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "");

describe("the widget guide", () => {
  it("names only Widget parts that exist", () => {
    const parts = code.flatMap((c) => [...c.matchAll(/\bWidget\.([A-Z]\w+)/g)].map((m) => m[1]));
    expect(parts.length).toBeGreaterThan(0);
    const widget = Widget as unknown as Record<string, unknown>;
    for (const part of parts) expect(widget[part as string], `Widget.${part}`).toBeDefined();
  });

  it("names only SDK exports", () => {
    const names = code
      .map((c) => c.replace(/\(\)$/, ""))
      .filter((c) => /^(use[A-Z]|Panel|is)[A-Za-z]*$|^[A-Z][a-z]+(?:[A-Z][a-z]+)*$/.test(c))
      .filter((c) => c !== "Widget" && c !== "Index");
    expect(names.length).toBeGreaterThan(10);
    for (const name of names) expect(sdk, name).toHaveProperty(name);
  });
});
