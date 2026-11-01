import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Widget } from "../../src/framework/core/Widget";
import {
  type ReactiveWidgetContext,
  WidgetCtx,
} from "../../src/framework/hooks/use-widget-context";

function hostCtx(hearsShell: boolean) {
  const reports: ({ tone: string | null } | null)[] = [];
  const ctx: ReactiveWidgetContext = {
    updateConfig: () => {},
    dimensions: () => ({ width: 0, height: 0 }),
    ...(hearsShell ? { onShell: (shell) => reports.push(shell) } : {}),
  };
  return { ctx, reports };
}

const halos = () => document.querySelectorAll(".glass-halo").length;

describe("the host hears a widget's shell", () => {
  it("the outer widget reports its tone, and nothing once it unmounts", () => {
    const host = hostCtx(true);
    const { unmount } = render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <Widget tone="info">
          <Widget color="#ff0000">Lamp</Widget>
        </Widget>
      </WidgetCtx.Provider>
    ));
    expect(host.reports.at(-1)).toEqual({ tone: "var(--tone-info)" });
    unmount();
    expect(host.reports.at(-1)).toBeNull();
  });

  it("a widget with no tone reports a shell without one", () => {
    const host = hostCtx(true);
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <Widget>Clock</Widget>
      </WidgetCtx.Provider>
    ));
    expect(host.reports.at(-1)).toEqual({ tone: null });
  });

  it("a host that hears the shell draws its halo, so the outer widget draws none of its own", () => {
    const host = hostCtx(true);
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <Widget>
          <Widget>Lamp</Widget>
        </Widget>
      </WidgetCtx.Provider>
    ));
    expect(halos()).toBe(1);
  });

  it("a host that does not hear the shell leaves the widget to draw its halo", () => {
    const host = hostCtx(false);
    render(() => (
      <WidgetCtx.Provider value={host.ctx}>
        <Widget>Lamp</Widget>
      </WidgetCtx.Provider>
    ));
    expect(halos()).toBe(1);
  });
});
