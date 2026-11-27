import { useFakeTime } from "@glasshome/ui/testing";
import { systemClock as clock, type TimerHandle } from "@glasshome/widget-contract/clock";
import { render, screen } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Cell } from "./harness/cell";
import { touchOn } from "./harness/press";
import { WidgetSliderFill } from "../../src/framework/backgrounds/WidgetSliderFill";
import { Widget } from "../../src/framework/core/Widget";
import { useWidgetGestures } from "../../src/framework/gestures/use-widget-gestures";
import { useEntityCommand } from "../../src/framework/hooks/use-entity-command";

const DEBOUNCE_MS = 300;
const PUSH_DELAY_MS = 1_000;
const SAMPLE_MS = 50;

/** A dimmer wired as the stock light is: a slide holds the value, the debounce sends it, the entity reports later. */
function mountDimmer(options: { failSend?: boolean } = {}) {
  const [reported, setReported] = createSignal(30);
  const sent: number[] = [];
  function Dimmer() {
    const brightness = useEntityCommand<number>({
      reported,
      send: async (value) => {
        sent.push(value);
        if (options.failSend) throw new Error("refused");
        clock.setTimeout(() => setReported(value), PUSH_DELAY_MS);
      },
      onError: () => {},
    });
    let debounce: TimerHandle | undefined;
    const gestures = useWidgetGestures(() => ({
      slide: {
        value: brightness.value(),
        onChange: (value: number) => {
          brightness.hold(value);
          clock.clearTimeout(debounce);
          debounce = clock.setTimeout(() => void brightness.run(value), DEBOUNCE_MS);
        },
        orientation: "horizontal",
      },
    }));
    return (
      <Widget gestures={gestures}>
        <WidgetSliderFill value={brightness.value()} isDragging={brightness.dragging()} />
        <span data-testid="level">{brightness.value()}</span>
      </Widget>
    );
  }
  render(() => (
    <Cell>
      <Dimmer />
    </Cell>
  ));
  const tile = screen.getByTestId("level").closest("[data-slot], div") as HTMLElement;
  const shown = () => Number(screen.getByTestId("level").textContent);
  return { tile, shown, sent };
}

async function dragTo(tile: HTMLElement, from: number, to: number) {
  await touchOn("touchStart", tile, [{ x: from, y: 0.5 }]);
  await touchOn("touchMove", tile, [{ x: (from + to) / 2, y: 0.5 }]);
  await touchOn("touchMove", tile, [{ x: to, y: 0.5 }]);
  await touchOn("touchEnd", tile, []);
}

describe("a dimmer released at 70 on a light at 30 whose push arrives a second later", () => {
  it("never shows 30 between the release and the report", async () => {
    useFakeTime();
    const { tile, shown, sent } = mountDimmer();
    await dragTo(tile, 0.3, 0.7);
    flush();
    const released = shown();
    expect(released).toBeGreaterThan(30);

    const seen: number[] = [];
    for (let ms = 0; ms < DEBOUNCE_MS + PUSH_DELAY_MS + 500; ms += SAMPLE_MS) {
      await vi.advanceTimersByTimeAsync(SAMPLE_MS);
      flush();
      seen.push(shown());
    }

    expect(sent).toEqual([released]);
    expect(seen.every((v) => v === released)).toBe(true);
  });

  it("goes back to 30 when the send is refused", async () => {
    useFakeTime();
    const { tile, shown, sent } = mountDimmer({ failSend: true });
    await dragTo(tile, 0.3, 0.7);
    flush();
    expect(shown()).toBeGreaterThan(30);

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    flush();
    expect(sent).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(SAMPLE_MS);
    flush();
    expect(shown()).toBe(30);
  });
});
