import { HOLD_GRACE_MS } from "@glasshome/ui/solid";
import { useFakeTime } from "@glasshome/ui/testing";
import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Widget } from "../../src/framework/core/Widget";
import { useWidgetGestures } from "../../src/framework/gestures/use-widget-gestures";
import { Cell } from "./harness/cell";
import { mouseOn } from "./harness/press";

describe("a hold's fill", () => {
  it("grows from where the press landed and reaches the farthest corner", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    function Tile() {
      const gestures = useWidgetGestures(() => ({ hold: { action: () => {} } }));
      return (
        <Widget gestures={gestures}>
          <span>Lamp</span>
        </Widget>
      );
    }
    const view = render(() => (
      <Cell>
        <Tile />
      </Cell>
    ));
    const shell = view.container.querySelector<HTMLElement>(".glasshome-widget");
    const flood = view.container.querySelector<HTMLElement>(".glasshome-widget-hold-flood");
    if (!shell || !flood) throw new Error("no widget shell");

    // Observers are called in the order they were made, so the widget's size reads have run when this one does.
    const sized = new Promise<void>((done) => {
      const after = new ResizeObserver(() => {
        after.disconnect();
        done();
      });
      after.observe(shell);
    });
    await mouseOn("down", shell, { x: 0.25, y: 0.75 });
    await sized;
    await vi.advanceTimersByTimeAsync(HOLD_GRACE_MS + 1);

    expect(flood.hasAttribute("data-hold")).toBe(true);
    const x = parseFloat(flood.style.left);
    const y = parseFloat(flood.style.top);
    expect(x).toBeCloseTo(302 * 0.25, 0);
    expect(y).toBeCloseTo(242 * 0.75, 0);
    expect(parseFloat(flood.style.width) / 2).toBeCloseTo(Math.hypot(302 - x, y), 0);
    await mouseOn("up", shell, { x: 0.25, y: 0.75 });
  });
});
