/**
 * What WidgetIcon renders. Its channel colour and its stacked-background count
 * are the two things widgets depend on, and both are set from props at runtime,
 * so neither is visible to a test that reads the source.
 */

import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { WidgetIcon } from "../../src/framework/components/WidgetIcon";

const glyph = <span data-testid="glyph">x</span>;

function root(container: HTMLElement) {
  const el = container.querySelector<HTMLElement>(".glasshome-widget-icon");
  if (!el) throw new Error("icon did not render");
  return el;
}

const stacks = (container: HTMLElement) =>
  container.querySelectorAll(".glasshome-widget-icon-stack").length;

describe("WidgetIcon", () => {
  it("renders the glyph inside the icon shell", () => {
    const { container, getByTestId } = render(() => <WidgetIcon icon={glyph} />);
    expect(root(container).contains(getByTestId("glyph"))).toBe(true);
  });

  // The colour travels as a custom property so the widget's stylesheet can
  // consume it; pinning a class here would say nothing about what is painted.
  it("sets the icon channel from the color prop, and leaves it unset otherwise", () => {
    const tinted = render(() => <WidgetIcon icon={glyph} color="oklch(0.7 0.2 195)" />);
    expect(root(tinted.container).style.getPropertyValue("--widget-icon-color")).toBe(
      "oklch(0.7 0.2 195)",
    );

    const plain = render(() => <WidgetIcon icon={glyph} />);
    expect(root(plain.container).style.getPropertyValue("--widget-icon-color")).toBe("");
  });

  it("stacks one background per extra entity, up to three", () => {
    expect(stacks(render(() => <WidgetIcon icon={glyph} entityCount={1} />).container)).toBe(0);
    expect(stacks(render(() => <WidgetIcon icon={glyph} entityCount={2} />).container)).toBe(1);
    expect(stacks(render(() => <WidgetIcon icon={glyph} entityCount={3} />).container)).toBe(2);
    expect(stacks(render(() => <WidgetIcon icon={glyph} entityCount={9} />).container)).toBe(2);
  });

  it("treats a missing entityCount as a single entity", () => {
    expect(stacks(render(() => <WidgetIcon icon={glyph} />).container)).toBe(0);
  });

  it("dims on request", () => {
    const dim = render(() => <WidgetIcon icon={glyph} dimmed />);
    expect(root(dim.container).className).toContain("opacity-50");

    const lit = render(() => <WidgetIcon icon={glyph} />);
    expect(root(lit.container).className).not.toContain("opacity-50");
  });

  it("keeps the caller's class alongside its own", () => {
    const { container } = render(() => <WidgetIcon icon={glyph} class="size-8" />);
    const className = root(container).className;
    expect(className).toContain("size-8");
    expect(className).toContain("glasshome-widget-icon");
  });
});
