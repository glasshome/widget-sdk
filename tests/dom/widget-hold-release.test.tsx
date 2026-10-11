import { HOLD_MS } from "@glasshome/ui/solid";
import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Widget } from "../../src/framework/core/Widget";
import { useWidgetGestures } from "../../src/framework/gestures/use-widget-gestures";
import { useFakeTime } from "./harness/fake-time";


describe("a held tile", () => {
  it("keeps the release click from the chip under the finger, and lets the next tap through", async () => {
    useFakeTime();
    const counts = { held: 0, chip: 0 };
    function Tile() {
      const gestures = useWidgetGestures(() => ({ hold: { action: () => counts.held++ } }));
      return (
        <Widget gestures={gestures}>
          <button type="button" onClick={() => counts.chip++}>
            Scene
          </button>
        </Widget>
      );
    }
    render(() => <Tile />);
    const chip = screen.getByText("Scene");

    fireEvent.pointerDown(chip, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    fireEvent.pointerUp(chip, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.click(chip);
    expect(counts).toEqual({ held: 1, chip: 0 });

    await vi.runAllTimersAsync();
    fireEvent.click(chip);
    expect(counts).toEqual({ held: 1, chip: 1 });
  });
});
