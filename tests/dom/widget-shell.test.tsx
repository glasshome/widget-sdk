/**
 * The widget shell's rendered contract: the class widget stylesheets hang off,
 * the colour channels a widget sets through props, and the precedence between
 * them. All of it is computed at render time from props, so it is exactly what
 * source-string assertions could never see.
 */

import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Widget } from "../../src/framework/core/Widget";

function shell(container: HTMLElement) {
  const el = container.querySelector<HTMLElement>(".glasshome-widget");
  if (!el) throw new Error("widget shell did not render");
  return el;
}

const channel = (container: HTMLElement, name: string) =>
  shell(container).style.getPropertyValue(name);

describe("Widget shell", () => {
  it("renders children inside the shell", () => {
    const { container, getByText } = render(() => (
      <Widget>
        <span>inside</span>
      </Widget>
    ));
    expect(shell(container).contains(getByText("inside"))).toBe(true);
  });

  it("injects the widget tokens once the shell mounts", () => {
    render(() => <Widget />);
    expect(document.querySelector("style[data-glasshome-tokens]")).toBeTruthy();
  });

  it("resolves a semantic tone to the widget colour channel", () => {
    const { container } = render(() => <Widget tone="warning" />);
    expect(channel(container, "--widget-color")).toBe("var(--tone-warning)");
  });

  it("lets an explicit colour beat the tone", () => {
    const { container } = render(() => <Widget tone="warning" color="oklch(0.7 0.2 195)" />);
    expect(channel(container, "--widget-color")).toBe("oklch(0.7 0.2 195)");
  });

  it("wears the ui glass class so the shell is the one material", () => {
    const { container } = render(() => <Widget />);
    expect(shell(container).classList.contains("glass")).toBe(true);
  });

  it("carries the second gradient stop on its channel", () => {
    const { container } = render(() => <Widget color="red" colorTo="blue" />);
    expect(channel(container, "--widget-color-to")).toBe("blue");
  });

  it("paints a deprecated full gradient inline, over the material", () => {
    const { container } = render(() => (
      <Widget gradient="linear-gradient(90deg, red, blue)" />
    ));
    expect(shell(container).style.backgroundImage).toBe("linear-gradient(90deg, red, blue)");
  });

  it("leaves every channel unset when no colour props are given", () => {
    const { container } = render(() => <Widget />);
    for (const name of ["--widget-color", "--widget-color-to"]) {
      expect(channel(container, name)).toBe("");
    }
    expect(shell(container).style.backgroundImage).toBe("");
  });

  it("empty state text reads theme ink, not a white alpha", () => {
    const { getByText } = render(() => (
      <Widget emptyState={{ title: "Nothing here", message: "Add an entity" }} />
    ));
    expect(getByText("Nothing here").className).toContain("text-foreground");
    expect(getByText("Add an entity").className).toContain("text-muted-foreground");
    expect(getByText("Nothing here").className).not.toMatch(/text-white/);
  });

  it("declares itself a size container so widgets can query their own box", () => {
    const { container } = render(() => <Widget />);
    expect(shell(container).style.getPropertyValue("container-type")).toBe("size");
  });

  it("shows the loading overlay only while loading", () => {
    const busy = render(() => <Widget loading />);
    expect(busy.container.querySelector(".glasshome-widget-loading")).toBeTruthy();

    const idle = render(() => <Widget />);
    expect(idle.container.querySelector(".glasshome-widget-loading")).toBeNull();
  });

  it("renders the empty state instead of children when one is given", () => {
    const { container, queryByText, getByText } = render(() => (
      <Widget emptyState={{ title: "Nothing here", message: "Add an entity" }}>
        <span>child</span>
      </Widget>
    ));
    expect(getByText("Nothing here")).toBeTruthy();
    expect(getByText("Add an entity")).toBeTruthy();
    expect(queryByText("child")).toBeNull();
    expect(shell(container)).toBeTruthy();
  });

  it("keeps the caller's class alongside the shell class", () => {
    const { container } = render(() => <Widget class="p-4" />);
    expect(shell(container).className).toContain("p-4");
  });
});
