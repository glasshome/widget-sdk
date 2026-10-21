import { HOLD_MS } from "@glasshome/ui/solid";
import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Cell } from "./harness/cell";
import { mouseOn } from "./harness/press";
import { Widget } from "../../src/framework/core/Widget";
import { useWidgetGestures } from "../../src/framework/gestures/use-widget-gestures";
import {
  type ReactiveWidgetContext,
  WidgetCtx,
} from "../../src/framework/hooks/use-widget-context";
import { PanelRow } from "../../src/framework/panel/panel";
import { useFakeTime } from "@glasshome/ui/testing";

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

function HoldTile() {
  const gestures = useWidgetGestures(() => ({ hold: { action: () => {} } }));
  return (
    <Cell>
      <Widget gestures={gestures}>
        <Widget>Lamp</Widget>
      </Widget>
    </Cell>
  );
}

function TapTile() {
  const gestures = useWidgetGestures(() => ({ tap: () => {} }));
  return <Widget gestures={gestures}>Clock</Widget>;
}

const shell = () => {
  const el = document.querySelector<HTMLElement>(".glasshome-widget");
  if (!el) throw new Error("shell did not render");
  return el;
};

describe("the host hears about holds", () => {
  it("a widget with a hold reports it can be held, and false once it unmounts", () => {
    const host = hostCtx();
    const { unmount } = render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <HoldTile />
      </WidgetCtx.Provider>
    ));
    expect(host.reports.at(-1)).toBe(true);
    unmount();
    expect(host.reports.at(-1)).toBe(false);
  });

  it("a <Widget> nested inside a holding widget does not overwrite its report", () => {
    const host = hostCtx();
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <HoldTile />
      </WidgetCtx.Provider>
    ));
    expect(host.reports.at(-1)).toBe(true);
  });

  it("a widget that only taps reports it cannot be held", () => {
    const host = hostCtx();
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <TapTile />
      </WidgetCtx.Provider>
    ));
    expect(host.reports.at(-1)).toBe(false);
  });

  it("an empty widget reports it cannot be held, though holding opens its settings", () => {
    const host = hostCtx();
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <Widget emptyState={{ title: "No light entity", message: "Hold to configure" }} />
      </WidgetCtx.Provider>
    ));
    expect(host.reports.at(-1)).toBe(false);
  });

  it("a fired hold is announced, a short press is not", async () => {
    useFakeTime();
    const host = hostCtx();
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <HoldTile />
      </WidgetCtx.Provider>
    ));
    await mouseOn("down", shell());
    await vi.advanceTimersByTimeAsync(100);
    await mouseOn("up", shell());
    expect(host.held()).toBe(0);

    await mouseOn("down", shell());
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    expect(host.held()).toBe(1);
    await mouseOn("up", shell());
  });

  it("the context-menu key is a hold too", async () => {
    const host = hostCtx();
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <HoldTile />
      </WidgetCtx.Provider>
    ));
    shell().focus();
    await userEvent.keyboard("{ContextMenu}");
    expect(host.held()).toBe(1);
  });

  it("a held panel row is announced", async () => {
    useFakeTime();
    const host = hostCtx();
    let opened = 0;
    const view = render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <PanelRow icon="lucide:lamp" name="Hallway" on={false} onHold={() => opened++} />
      </WidgetCtx.Provider>
    ));
    await mouseOn("down", view.getByText("Hallway"));
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    expect({ opened, held: host.held() }).toEqual({ opened: 1, held: 1 });
    await mouseOn("up", view.getByText("Hallway"));
  });
});
