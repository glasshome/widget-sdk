import { fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Widget } from "../../src/framework/core/Widget";
import { useWidgetDialog } from "../../src/framework/hooks/use-widget-dialog";
import { WidgetCtx } from "../../src/framework/hooks/use-widget-context";

function EmptyWidget() {
  const dialog = useWidgetDialog();
  return (
    <>
      <Widget emptyState={{ title: "No light entity", message: "Hold to configure" }} />
      <span data-testid="dialog">{dialog.showDialog() ? dialog.activeTab() : "closed"}</span>
    </>
  );
}

afterEach(() => vi.useRealTimers());

describe("an empty tile", () => {
  it("opens the widget's settings when held", () => {
    vi.useFakeTimers();
    const ctx = { updateConfig: () => {}, dimensions: () => ({ width: 0, height: 0 }) };
    render(() => (
      <WidgetCtx.Provider value={ctx}>
        <EmptyWidget />
      </WidgetCtx.Provider>
    ));

    const shell = document.querySelector<HTMLElement>(".glasshome-widget");
    if (!shell) throw new Error("shell did not render");
    fireEvent.pointerDown(shell, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    vi.advanceTimersByTime(600);

    expect(screen.getByTestId("dialog").textContent).toBe("edit");
  });

  it("opens the widget's settings from the context-menu key", () => {
    const ctx = { updateConfig: () => {}, dimensions: () => ({ width: 0, height: 0 }) };
    render(() => (
      <WidgetCtx.Provider value={ctx}>
        <EmptyWidget />
      </WidgetCtx.Provider>
    ));

    const shell = document.querySelector<HTMLElement>(".glasshome-widget");
    if (!shell) throw new Error("shell did not render");
    expect(shell.tabIndex).toBe(0);
    fireEvent.keyDown(shell, { key: "ContextMenu" });

    expect(screen.getByTestId("dialog").textContent).toBe("edit");
  });
});
