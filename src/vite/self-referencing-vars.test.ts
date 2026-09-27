import { describe, expect, it } from "bun:test";
import { dropSelfReferencingVars } from "./index";

describe("dropSelfReferencingVars", () => {
  it("drops a variable defined as itself and keeps every other declaration", () => {
    const css =
      "@layer theme{:root,:host{--font-sans:var(--font-sans);--color-card:var(--card);--shadow:var(--shadow)}}";
    expect(dropSelfReferencingVars(css)).toBe("@layer theme{:root,:host{--color-card:var(--card);}}");
  });

  it("keeps a variable that only starts with the same name", () => {
    const css = ":host{--font:var(--font-sans);--radius:var(--radius-lg)}";
    expect(dropSelfReferencingVars(css)).toBe(css);
  });
});
