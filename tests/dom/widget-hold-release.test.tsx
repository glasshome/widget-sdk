import { HOLD_MS } from "@glasshome/ui/solid";
import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Cell } from "./harness/cell";
import { mouseOn } from "./harness/press";
import { Widget } from "../../src/framework/core/Widget";
import { useWidgetGestures } from "../../src/framework/gestures/use-widget-gestures";
import { useFakeTime } from "@glasshome/ui/testing";

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
    render(() => (
      <Cell>
        <Tile />
      </Cell>
    ));
    const chip = screen.getByText("Scene");

    await mouseOn("down", chip);
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    await mouseOn("up", chip);
    expect(counts).toEqual({ held: 1, chip: 0 });

    await vi.runAllTimersAsync();
    await userEvent.click(chip);
    expect(counts).toEqual({ held: 1, chip: 1 });
  });
});
