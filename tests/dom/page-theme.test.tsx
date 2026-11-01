import { render, screen } from "@solidjs/testing-library";
import { createMemo } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "../../src/framework/hooks/use-reduced-motion";
import { isDark } from "../../src/theme";

const html = document.documentElement;

afterEach(() => {
  html.classList.remove("dark", "reduce-motion");
});

describe("the home's theme from <html>", () => {
  it("isDark() reads the class at once and runs a memo again when the home flips", async () => {
    render(() => {
      const mode = createMemo(() => (isDark() ? "dark" : "light"));
      return <span data-testid="mode">{mode()}</span>;
    });
    expect(screen.getByTestId("mode").textContent).toBe("light");
    html.classList.add("dark");
    expect(isDark()).toBe(true);
    await vi.waitFor(() => expect(screen.getByTestId("mode").textContent).toBe("dark"));
    html.classList.remove("dark");
    await vi.waitFor(() => expect(screen.getByTestId("mode").textContent).toBe("light"));
  });

  it("useReducedMotion() follows the home's Reduce motion setting", async () => {
    render(() => {
      const reduced = useReducedMotion();
      return <span data-testid="reduced">{String(reduced())}</span>;
    });
    expect(screen.getByTestId("reduced").textContent).toBe("false");
    html.classList.add("reduce-motion");
    await vi.waitFor(() => expect(screen.getByTestId("reduced").textContent).toBe("true"));
    html.classList.remove("reduce-motion");
    await vi.waitFor(() => expect(screen.getByTestId("reduced").textContent).toBe("false"));
  });
});
