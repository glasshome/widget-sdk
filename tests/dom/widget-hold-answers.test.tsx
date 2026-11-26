import { HOLD_MS } from "@glasshome/ui/solid";
import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Widget } from "../../src/framework/core/Widget";
import { useWidgetGestures } from "../../src/framework/gestures/use-widget-gestures";
import {
  type ReactiveWidgetContext,
  WidgetCtx,
} from "../../src/framework/hooks/use-widget-context";
import { useFakeTime } from "@glasshome/ui/testing";
import { Cell } from "./harness/cell";
import { mouseOn } from "./harness/press";
import "../../src/framework/theming/tokens.css";

function hostCtx() {
  const reports: boolean[] = [];
  let held = 0;
  const ctx: ReactiveWidgetContext = {
    updateConfig: () => {},
    onHoldable: (holds) => reports.push(holds),
    onHeld: () => held++,
  };
  return { ctx, reports, held: () => held };
}

const shell = () => {
  const el = document.querySelector<HTMLElement>(".glasshome-widget");
  if (!el) throw new Error("shell did not render");
  return el;
};

const press = (el: Element) => mouseOn("down", el);
const release = (el: Element) => mouseOn("up", el);

describe("every widget answers a hold", () => {
  it("fires at the shared hold length, not before", async () => {
    useFakeTime();
    const host = hostCtx();
    function Tile() {
      const gestures = useWidgetGestures(() => ({ hold: { action: () => {} } }));
      return <Widget gestures={gestures}>Lamp</Widget>;
    }
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <Cell>
          <Tile />
        </Cell>
      </WidgetCtx.Provider>
    ));
    await press(shell());
    await vi.advanceTimersByTimeAsync(HOLD_MS - 1);
    expect(host.held()).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(host.held()).toBe(1);
    await release(shell());
  });

  it("a widget with nothing more to open shakes once, says nothing, and the tour does not count it", async () => {
    useFakeTime();
    const host = hostCtx();
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <Cell>
          <Widget>Clock</Widget>
        </Cell>
      </WidgetCtx.Provider>
    ));
    expect(host.reports.at(-1)).toBe(false);
    const frame = shell().closest<HTMLElement>(".glasshome-widget-frame");
    if (!frame) throw new Error("frame did not render");

    await press(shell());
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    await release(shell());
    expect(frame.hasAttribute("data-nothing-more")).toBe(true);
    expect(document.querySelector("[data-expanded]")).toBeNull();

    const [shake] = frame.getAnimations();
    expect(shake).toBeDefined();
    const ended = new Promise((resolve) =>
      frame.addEventListener("animationend", resolve, { once: true }),
    );
    shake?.finish();
    await ended;
    expect(frame.hasAttribute("data-nothing-more")).toBe(false);
  });

  it("holds from a control row, while a short press there stays the control's", async () => {
    useFakeTime();
    const counts = { tap: 0, held: 0, button: 0 };
    function Tile() {
      const gestures = useWidgetGestures(() => ({
        tap: () => counts.tap++,
        hold: { action: () => counts.held++ },
      }));
      return (
        <Widget gestures={gestures}>
          <Widget.Controls>
            <button type="button" onClick={() => counts.button++}>
              Press
            </button>
          </Widget.Controls>
        </Widget>
      );
    }
    render(() => (
      <Cell>
        <Tile />
      </Cell>
    ));
    const button = screen.getByText("Press");

    await press(button);
    await release(button);
    expect(counts).toEqual({ tap: 0, held: 0, button: 1 });

    await press(button);
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    await release(button);
    expect(counts).toEqual({ tap: 0, held: 1, button: 1 });
  });
});
