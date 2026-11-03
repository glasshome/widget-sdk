import { render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Cell } from "./harness/cell";
import { touchOn } from "./harness/press";
import { Widget } from "../../src/framework/core/Widget";
import { useWidgetGestures } from "../../src/framework/gestures/use-widget-gestures";

function mountSlider() {
  const [value, setValue] = createSignal(50);
  function Dimmer() {
    const gestures = useWidgetGestures(() => ({
      slide: { value: value(), onChange: setValue, orientation: "horizontal" },
    }));
    return (
      <Widget gestures={gestures}>
        <span>Lamp</span>
      </Widget>
    );
  }
  render(() => (
    <Cell>
      <Dimmer />
    </Cell>
  ));
  return { value, tile: screen.getByText("Lamp") };
}

describe("a slider widget under a finger", () => {
  it("one finger slides the value", async () => {
    const { value, tile } = mountSlider();
    await touchOn("touchStart", tile, [{ x: 0.3, y: 0.5 }]);
    await touchOn("touchMove", tile, [{ x: 0.5, y: 0.5 }]);
    await touchOn("touchMove", tile, [{ x: 0.7, y: 0.5 }]);
    await touchOn("touchEnd", tile, []);
    await expect.poll(value).toBeGreaterThan(50);
  });

  it("a cancelled slide puts the value back", async () => {
    const { value, tile } = mountSlider();
    await touchOn("touchStart", tile, [{ x: 0.3, y: 0.5 }]);
    await touchOn("touchMove", tile, [{ x: 0.4, y: 0.5 }]);
    await touchOn("touchMove", tile, [{ x: 0.6, y: 0.5 }]);
    await expect.poll(value).toBeGreaterThan(50);
    // What the page delivers when it takes the press, as the sealed realm does for a second finger.
    tile.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerType: "touch" }));
    await touchOn("touchEnd", tile, []);
    expect(value()).toBe(50);
  });
});
