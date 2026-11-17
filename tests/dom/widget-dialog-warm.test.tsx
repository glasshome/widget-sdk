import { render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it } from "vitest";
import { WidgetDialog } from "../../src/framework/dialogs/WidgetDialog";
import { warmSheets } from "../../src/framework/dialogs/warm-dialogs";
import {
  type ReactiveWidgetContext,
  useWidgetDialog,
  type WidgetDialogReturn,
  WidgetCtx,
} from "../../src/framework/hooks";

const newCtx = (): ReactiveWidgetContext & { opener?: (tab?: string) => void } => {
  const ctx: ReactiveWidgetContext & { opener?: (tab?: string) => void } = {
    updateConfig: () => {},
    dimensions: () => ({ width: 0, height: 0 }),
    registerDialogOpener: (open) => {
      ctx.opener = open ?? undefined;
    },
  };
  return ctx;
};

const passthrough = (props: { children?: JSX.Element }) => <div>{props.children}</div>;

const stubs = {
  ResponsiveDialog: passthrough,
  ResponsiveDialogContent: passthrough,
  ResponsiveDialogHeader: passthrough,
  ResponsiveDialogTitle: passthrough,
  ResponsiveDialogDescription: passthrough,
  Button: (props: { children?: JSX.Element; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={() => props.onClick?.()} disabled={props.disabled}>
      {props.children}
    </button>
  ),
};

function mount(ctx: ReactiveWidgetContext) {
  let dialog: WidgetDialogReturn | undefined;
  const view = render(() => (
    <WidgetCtx.Provider value={ctx}>
      {(() => {
        dialog = useWidgetDialog();
        return (
          <WidgetDialog
            {...stubs}
            {...dialog.dialogProps}
            title="Sheet"
            sheet={() => <p>sheet</p>}
          />
        );
      })()}
    </WidgetCtx.Provider>
  ));
  if (!dialog) throw new Error("hook did not run");
  return { dialog, unmount: view.unmount };
}

describe("useWidgetDialog and the warm set", () => {
  it("openDialog touches the widget's context", () => {
    const ctx = newCtx();
    const { dialog } = mount(ctx);
    expect(warmSheets.has(ctx)).toBe(false);
    dialog.openDialog();
    expect(warmSheets.has(ctx)).toBe(true);
  });

  it("the host's opener touches it", () => {
    const ctx = newCtx();
    mount(ctx);
    ctx.opener?.("edit");
    expect(warmSheets.has(ctx)).toBe(true);
  });

  it("onOpenChange(true) touches it", () => {
    const ctx = newCtx();
    const { dialog } = mount(ctx);
    dialog.dialogProps.onOpenChange(true);
    expect(warmSheets.has(ctx)).toBe(true);
  });

  it("closing does not drop it", () => {
    const ctx = newCtx();
    const { dialog } = mount(ctx);
    dialog.openDialog();
    dialog.closeDialog();
    expect(warmSheets.has(ctx)).toBe(true);
  });

  it("opening again while open does not move it to most recent", () => {
    const [a, b, c, d] = [newCtx(), newCtx(), newCtx(), newCtx()];
    const first = mount(a);
    const second = mount(b);
    first.dialog.openDialog();
    second.dialog.openDialog();
    first.dialog.openDialog();
    first.dialog.dialogProps.onOpenChange(true);
    mount(c).dialog.openDialog();
    mount(d).dialog.openDialog();
    expect([a, b, c, d].map((ctx) => warmSheets.has(ctx))).toEqual([false, true, true, true]);
  });

  it("reopening after a close counts again", () => {
    const [a, b, c, d] = [newCtx(), newCtx(), newCtx(), newCtx()];
    const first = mount(a);
    first.dialog.openDialog();
    mount(b).dialog.openDialog();
    first.dialog.closeDialog();
    first.dialog.openDialog();
    mount(c).dialog.openDialog();
    mount(d).dialog.openDialog();
    expect([a, b, c, d].map((ctx) => warmSheets.has(ctx))).toEqual([true, false, true, true]);
  });

  it("unmounting a widget that never rendered a WidgetDialog drops its context", () => {
    const ctx = newCtx();
    let dialog: WidgetDialogReturn | undefined;
    const view = render(() => (
      <WidgetCtx.Provider value={ctx}>
        {(() => {
          dialog = useWidgetDialog();
          return <p>no dialog</p>;
        })()}
      </WidgetCtx.Provider>
    ));
    dialog?.openDialog();
    expect(warmSheets.has(ctx)).toBe(true);
    view.unmount();
    expect(warmSheets.has(ctx)).toBe(false);
  });

  it("unmounting the widget drops its context", () => {
    const ctx = newCtx();
    const { dialog, unmount } = mount(ctx);
    dialog.openDialog();
    unmount();
    expect(warmSheets.has(ctx)).toBe(false);
  });
});
