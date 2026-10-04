/**
 * The material reaches a widget two ways: useMaterial() for deciding, the public
 * --material-* variables for painting. The shell marks whether the widget has
 * its own tone, which is what keeps the material's fill off toned widgets.
 */

import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { materialTerms } from "@glasshome/ui/tokens";
import { Widget } from "../../src/framework/core/Widget";
import { useMaterial } from "../../src/framework/hooks/use-material";
import {
  type ReactiveWidgetContext,
  type WidgetMaterial,
  WidgetCtx,
} from "../../src/framework/hooks/use-widget-context";

function Probe() {
  const material = useMaterial();
  return (
    <span data-testid="probe">
      {material().id}:{material().terms.face}:{material().terms.glow}
    </span>
  );
}

const host = (material: () => WidgetMaterial): ReactiveWidgetContext => ({
  updateConfig: () => {},
  dimensions: () => ({ width: 0, height: 0 }),
  material,
});

describe("useMaterial", () => {
  it("reads the host's material and follows it when the home changes material", () => {
    const neon = { v: 1, preset: "neon", dials: { face: "raised" } } as const;
    const [worn, setWorn] = createSignal<WidgetMaterial>({
      id: "frosted",
      terms: materialTerms({ v: 1, preset: "frosted" }),
    });
    const view = render(() => (
      <WidgetCtx.Provider value={host(worn)}>
        <Probe />
      </WidgetCtx.Provider>
    ));
    expect(view.getByTestId("probe").textContent).toBe("frosted:flat:0");
    setWorn({ id: "neon", terms: materialTerms(neon) });
    expect(view.getByTestId("probe").textContent).toBe("neon:raised:3");
  });

  it("is plain Frosted glass on a host that predates materials", () => {
    const view = render(() => <Probe />);
    expect(view.getByTestId("probe").textContent).toBe("frosted:flat:0");
  });
});

describe("the shell's tone mark", () => {
  it("marks a widget with its own tone or colour, never a neutral one", () => {
    const shell = (c: HTMLElement) => c.querySelector<HTMLElement>(".glasshome-widget");
    expect(
      shell(render(() => <Widget tone="warning" />).container)?.hasAttribute("data-toned"),
    ).toBe(true);
    expect(
      shell(render(() => <Widget color="oklch(0.7 0.1 30)" />).container)?.hasAttribute(
        "data-toned",
      ),
    ).toBe(true);
    expect(
      shell(render(() => <Widget tone="neutral" />).container)?.hasAttribute("data-toned"),
    ).toBe(false);
    expect(shell(render(() => <Widget />).container)?.hasAttribute("data-toned")).toBe(false);
  });
});
