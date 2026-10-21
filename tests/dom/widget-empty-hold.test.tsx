import { HOLD_MS } from "@glasshome/ui/solid";
import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Cell } from "./harness/cell";
import { mouseOn } from "./harness/press";
import { Widget } from "../../src/framework/core/Widget";
import { useWidgetDialog } from "../../src/framework/hooks/use-widget-dialog";
import { WidgetCtx } from "../../src/framework/hooks/use-widget-context";
import { useFakeTime } from "@glasshome/ui/testing";

function EmptyWidget() {
  const dialog = useWidgetDialog();
  return (
    <>
      <Widget emptyState={{ title: "No light entity", message: "Hold to configure" }} />
      <span data-testid="dialog">{dialog.showDialog() ? dialog.activeTab() : "closed"}</span>
    </>
  );
}

describe("an empty tile", () => {
  it("opens the widget's settings when held", async () => {
    useFakeTime();
    const ctx = { updateConfig: () => {}, dimensions: () => ({ width: 0, height: 0 }) };
    render(() => (
      <WidgetCtx.Provider value={ctx}>
        <Cell>
          <EmptyWidget />
        </Cell>
      </WidgetCtx.Provider>
    ));

    const shell = document.querySelector<HTMLElement>(".glasshome-widget");
    if (!shell) throw new Error("shell did not render");
    await mouseOn("down", shell);
    await vi.advanceTimersByTimeAsync(HOLD_MS);

    expect(screen.getByTestId("dialog").textContent).toBe("edit");
    await mouseOn("up", shell);
  });

  it("opens the widget's settings from the context-menu key", async () => {
    const ctx = { updateConfig: () => {}, dimensions: () => ({ width: 0, height: 0 }) };
    render(() => (
      <WidgetCtx.Provider value={ctx}>
        <Cell>
          <EmptyWidget />
        </Cell>
      </WidgetCtx.Provider>
    ));

    const shell = document.querySelector<HTMLElement>(".glasshome-widget");
    if (!shell) throw new Error("shell did not render");
    expect(shell.tabIndex).toBe(0);
    shell.focus();
    await userEvent.keyboard("{ContextMenu}");

    expect(screen.getByTestId("dialog").textContent).toBe("edit");
  });
});
