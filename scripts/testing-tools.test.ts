import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compileCatalogSource } from "@glasshome/widget-contract/catalog-build";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");

function graphOf(entry: string): Map<string, string> {
  const seen = new Map<string, string>();
  const queue = [resolve(dist, entry)];
  for (let file = queue.pop(); file; file = queue.pop()) {
    if (seen.has(file)) continue;
    const source = readFileSync(file, "utf8");
    seen.set(file, source);
    for (const match of source.matchAll(/(?:from|import)\s*["'](\.[^"']+)["']/g)) {
      queue.push(resolve(dirname(file), match[1] ?? ""));
    }
  }
  return seen;
}

describe("the built testing/tools entry", () => {
  it("loads under bun test and translates", async () => {
    const english = compileCatalogSource('{ "a": "one" }', "en.json");
    const { languageTools } = await import("../dist/testing/tools.js");
    const tools = languageTools({ language: "en", formatting: "en-US", catalog: null, english });
    expect(tools.t("a")).toBe("one");
  });

  it("reaches neither @glasshome/ui nor the provider", () => {
    const graph = graphOf("testing/tools.js");
    expect(graph.size).toBeGreaterThan(1);
    for (const [file, source] of graph) {
      expect(file).not.toMatch(/provider/);
      expect(source).not.toMatch(/@glasshome\/ui/);
    }
  });
});
