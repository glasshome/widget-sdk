import { render } from "@solidjs/testing-library";
import { type JSX, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { describe, expect, it } from "vitest";
import { useSheetDormant, WidgetDialog } from "../../src/framework/dialogs/WidgetDialog";
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

/** The injected ResponsiveDialog as ui's kept Dialog behaves: shown while open, held dormant while `keep`. */
function KeepingDialog(props: { open?: boolean; keep?: boolean; children?: JSX.Element }) {
  return (
    <Show when={props.open || props.keep}>
      <Portal>
        <div data-layer data-dormant={props.open ? undefined : ""}>
          {props.children}
        </div>
      </Portal>
    </Show>
  );
}

function SheetBody(props: { name: string }) {
  const dormant = useSheetDormant();
  return <p data-sheet={props.name}>{dormant() ? "dormant" : "shown"}</p>;
}

function mountSheet(name: string) {
  const ctx = newCtx();
  let dialog: WidgetDialogReturn | undefined;
  const view = render(() => (
    <WidgetCtx.Provider value={ctx}>
      {(() => {
        dialog = useWidgetDialog();
        return (
          <WidgetDialog
            {...stubs}
            ResponsiveDialog={KeepingDialog}
            {...dialog.dialogProps}
            title={name}
            editContent={<p data-edit={name}>edit</p>}
            sheet={() => <SheetBody name={name} />}
          />
        );
      })()}
    </WidgetCtx.Provider>
  ));
  if (!dialog) throw new Error("hook did not run");
  return { ctx, dialog, unmount: view.unmount };
}

const sheetOf = (name: string) => document.querySelector<HTMLElement>(`[data-sheet="${name}"]`);

describe("a warm sheet", () => {
  it("reopens on the node it closed with", () => {
    const a = mountSheet("a");
    a.dialog.openDialog();
    const first = sheetOf("a");
    expect(first).not.toBeNull();
    a.dialog.closeDialog();
    expect(first?.isConnected).toBe(true);
    expect(first?.closest("[data-dormant]")).not.toBeNull();
    a.dialog.openDialog();
    expect(sheetOf("a")).toBe(first);
    expect(first?.closest("[data-dormant]")).toBeNull();
  });

  it("a fourth widget's open evicts the least recent, and that sheet unmounts", () => {
    const widgets = ["a", "b", "c", "d"].map(mountSheet);
    for (const widget of widgets.slice(0, 3)) {
      widget.dialog.openDialog();
      widget.dialog.closeDialog();
    }
    const kept = ["a", "b", "c"].map(sheetOf);
    expect(kept.map((node) => node?.isConnected)).toEqual([true, true, true]);
    widgets[3]?.dialog.openDialog();
    expect(kept.map((node) => node?.isConnected)).toEqual([false, true, true]);
  });

  it("edit-mode settings never keep", () => {
    const a = mountSheet("a");
    a.dialog.openDialog("edit");
    expect(document.querySelector('[data-edit="a"]')).not.toBeNull();
    a.dialog.closeDialog();
    expect(warmSheets.has(a.ctx)).toBe(true);
    expect(document.querySelector('[data-edit="a"]')).toBeNull();
    expect(document.querySelector("[data-layer]")).toBeNull();
  });

  it("a widget unmounted while its sheet is dormant takes the layer with it", () => {
    const a = mountSheet("a");
    a.dialog.openDialog();
    a.dialog.closeDialog();
    const layer = sheetOf("a")?.closest("[data-layer]");
    expect(layer?.isConnected).toBe(true);
    a.unmount();
    expect(layer?.isConnected).toBe(false);
    expect(warmSheets.has(a.ctx)).toBe(false);
  });

  it("its body reads dormant from the close to the next open", () => {
    const a = mountSheet("a");
    a.dialog.openDialog();
    expect(sheetOf("a")?.textContent).toBe("shown");
    a.dialog.closeDialog();
    expect(sheetOf("a")?.textContent).toBe("dormant");
    a.dialog.openDialog();
    expect(sheetOf("a")?.textContent).toBe("shown");
  });
});
