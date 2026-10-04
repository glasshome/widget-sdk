import { HOLD_MS } from "@glasshome/ui/solid";
import { fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Widget } from "../../src/framework/core/Widget";
import { useWidgetGestures } from "../../src/framework/gestures/use-widget-gestures";
import {
  type ReactiveWidgetContext,
  WidgetCtx,
} from "../../src/framework/hooks/use-widget-context";

afterEach(() => vi.useRealTimers());

function hostCtx() {
  const reports: boolean[] = [];
  let held = 0;
  const ctx: ReactiveWidgetContext = {
    updateConfig: () => {},
    dimensions: () => ({ width: 0, height: 0 }),
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

const press = (el: Element) =>
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
const release = (el: Element) =>
  fireEvent.pointerUp(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });

describe("every widget answers a hold", () => {
  it("fires at the shared hold length, not before", () => {
    vi.useFakeTimers();
    const host = hostCtx();
    function Tile() {
      const gestures = useWidgetGestures(() => ({ hold: { action: () => {} } }));
      return <Widget gestures={gestures}>Lamp</Widget>;
    }
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <Tile />
      </WidgetCtx.Provider>
    ));
    press(shell());
    vi.advanceTimersByTime(HOLD_MS - 1);
    expect(host.held()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(host.held()).toBe(1);
  });

  it("a widget with nothing more to open says so, and the tour does not count it", () => {
    vi.useFakeTimers();
    const host = hostCtx();
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <Widget>Clock</Widget>
      </WidgetCtx.Provider>
    ));
    expect(host.reports.at(-1)).toBe(false);

    press(shell());
    vi.advanceTimersByTime(HOLD_MS);
    const notice = screen.getByText("No more controls for this widget");
    expect(notice.hasAttribute("data-closed")).toBe(false);
    vi.advanceTimersByTime(2000);
    expect(notice.hasAttribute("data-closed") || !notice.isConnected).toBe(true);
  });

  it("holds from a control row, while a short press there stays the control's", () => {
    vi.useFakeTimers();
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
    render(() => <Tile />);
    const button = screen.getByText("Press");

    press(button);
    release(button);
    fireEvent.click(button);
    expect(counts).toEqual({ tap: 0, held: 0, button: 1 });

    press(button);
    vi.advanceTimersByTime(HOLD_MS);
    release(button);
    fireEvent.click(button);
    expect(counts).toEqual({ tap: 0, held: 1, button: 1 });
  });
});
