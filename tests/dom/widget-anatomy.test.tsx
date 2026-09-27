import { fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { onCleanup } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Widget } from "../../src/framework/core/Widget";
import { useWidgetGestures } from "../../src/framework/gestures/use-widget-gestures";
import { useConfirm } from "../../src/framework/hooks/use-confirm";
import { WidgetCtx } from "../../src/framework/hooks/use-widget-context";
import { useWidgetDialog } from "../../src/framework/hooks/use-widget-dialog";
import { widgetRegistry } from "../../src/framework/hooks/widget-registry";

afterEach(() => vi.useRealTimers());

const hostCtx = () => ({
  updateConfig: () => {},
  dimensions: () => ({ width: 0, height: 0 }),
});

describe("Widget.Content", () => {
  it("lays anatomy parts out as a tile and keeps the column for the original slots", () => {
    render(() => (
      <>
        <Widget>
          <Widget.Content>
            <Widget.Head name="Lamp" />
          </Widget.Content>
        </Widget>
        <Widget>
          <Widget.Content>
            <Widget.Title>Lamp</Widget.Title>
          </Widget.Content>
        </Widget>
      </>
    ));
    expect(document.querySelectorAll(".glasshome-widget-grid")).toHaveLength(1);
    expect(document.querySelectorAll(".glasshome-widget-content")).toHaveLength(1);
  });
});

describe("a confirmed widget", () => {
  it("turns the head icon and the glyph into a check", () => {
    render(() => (
      <Widget confirmed>
        <Widget.Content>
          <Widget.Glyph icon="mdi:palette" />
          <Widget.Head icon="mdi:palette" name="Movie Night" />
        </Widget.Content>
      </Widget>
    ));
    const icons = [...document.querySelectorAll("[data-icon]")].map((e) =>
      e.getAttribute("data-icon"),
    );
    expect(document.querySelector(".glasshome-widget")?.hasAttribute("data-confirmed")).toBe(true);
    expect(icons.filter((i) => i === "mdi:check")).toHaveLength(2);
    expect(icons).not.toContain("mdi:palette");
  });
});

describe("Widget.Action", () => {
  it("ticks after the call succeeds and not after it fails", async () => {
    const calls: string[] = [];
    function Tile() {
      return (
        <Widget>
          <Widget.Content>
            <Widget.Head name="Blind" />
            <Widget.Controls>
              <Widget.Action
                icon="mdi:stop"
                aria-label="Stop"
                run={async () => calls.push("stop")}
              />
              <Widget.Action
                icon="mdi:play"
                aria-label="Fail"
                run={async () => {
                  throw new Error("offline");
                }}
              />
            </Widget.Controls>
          </Widget.Content>
        </Widget>
      );
    }
    render(() => <Tile />);
    const stop = screen.getByLabelText("Stop");
    const fail = screen.getByLabelText("Fail");
    fireEvent.click(stop);
    fireEvent.click(fail);
    await waitFor(() => expect(stop.hasAttribute("data-confirmed")).toBe(true));
    expect(fail.hasAttribute("data-confirmed")).toBe(false);
    expect(calls).toEqual(["stop"]);
  });

  it("shares one confirm with the tile", async () => {
    let confirm: ReturnType<typeof useConfirm> | undefined;
    function Tile() {
      confirm = useConfirm();
      return (
        <Widget confirmed={confirm.any()}>
          <Widget.Content>
            <Widget.Head name="Scenes" />
            <Widget.Action icon="mdi:play" confirm={confirm} id="movie" run={() => {}}>
              Movie
            </Widget.Action>
          </Widget.Content>
        </Widget>
      );
    }
    render(() => <Tile />);
    fireEvent.click(screen.getByText("Movie"));
    await waitFor(() =>
      expect(document.querySelector(".glasshome-widget")?.hasAttribute("data-confirmed")).toBe(
        true,
      ),
    );
    expect(confirm?.has("movie")).toBe(true);
  });
});

describe("a widget with a sheet", () => {
  it("holds to open it without wiring a hold, and not before it has one", () => {
    vi.useFakeTimers();
    const ctx = hostCtx();
    let dialog: ReturnType<typeof useWidgetDialog> | undefined;
    function Tile() {
      dialog = useWidgetDialog();
      return (
        <Widget>
          <Widget.Content>
            <Widget.Head icon="mdi:fan" name="Fan" />
          </Widget.Content>
        </Widget>
      );
    }
    render(() => (
      <WidgetCtx.Provider value={ctx}>
        <Tile />
      </WidgetCtx.Provider>
    ));
    const shell = document.querySelector<HTMLElement>(".glasshome-widget");
    if (!shell) throw new Error("shell did not render");
    const hold = () => {
      fireEvent.pointerDown(shell, {
        button: 0,
        pointerId: 1,
        clientX: 10,
        clientY: 10,
      });
      vi.advanceTimersByTime(600);
      fireEvent.pointerUp(shell, {
        button: 0,
        pointerId: 1,
        clientX: 10,
        clientY: 10,
      });
    };

    hold();
    expect(dialog?.showDialog()).toBe(false);

    widgetRegistry(ctx)?.setHasSheet(true);
    hold();
    expect(dialog?.showDialog()).toBe(true);
    expect(widgetRegistry(ctx)?.icon()).toBe("mdi:fan");
  });

  it("holds to open it when the widget wires a tap and no hold", () => {
    vi.useFakeTimers();
    const ctx = hostCtx();
    const taps: string[] = [];
    let dialog: ReturnType<typeof useWidgetDialog> | undefined;
    function Tile() {
      dialog = useWidgetDialog();
      const gestures = useWidgetGestures(() => ({ tap: () => taps.push("tap") }));
      onCleanup(gestures.dispose);
      return (
        <Widget gestures={gestures}>
          <Widget.Content>
            <Widget.Head name="Lamp" />
          </Widget.Content>
        </Widget>
      );
    }
    render(() => (
      <WidgetCtx.Provider value={ctx}>
        <Tile />
      </WidgetCtx.Provider>
    ));
    const shell = document.querySelector<HTMLElement>(".glasshome-widget");
    if (!shell) throw new Error("shell did not render");
    widgetRegistry(ctx)?.setHasSheet(true);
    fireEvent.pointerDown(shell, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    vi.advanceTimersByTime(600);
    fireEvent.pointerUp(shell, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    expect(dialog?.showDialog()).toBe(true);
    expect(taps).toEqual([]);
  });
});
