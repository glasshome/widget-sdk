/**
 * The dialog's own draft lifecycle, mounted with stub primitives. The real ui
 * composition (Select/Switch repaint) is a host concern and lives in dash's
 * seam test, where ui and the SDK meet at their pinned versions.
 */

import { fireEvent, render, screen } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { WidgetDialog } from "../../src/framework/dialogs/WidgetDialog";

/** A minimal controlled form: one text input per property, same contract as ui's SchemaForm. */
function StubSchemaForm(props: {
  schema: { properties?: Record<string, unknown> };
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  errors?: string[];
}): JSX.Element {
  return (
    <div>
      {Object.keys(props.schema.properties ?? {}).map((key) => (
        <input
          aria-label={key}
          value={String(props.data[key] ?? "")}
          onInput={(e) => props.onChange({ ...props.data, [key]: e.currentTarget.value })}
        />
      ))}
      {(props.errors ?? []).map((error) => (
        <p data-slot="error">{error}</p>
      ))}
    </div>
  );
}

const passthrough = (props: { children?: JSX.Element }) => <div>{props.children}</div>;

const stubs = {
  // The real ResponsiveDialog reports dismissal through onOpenChange; the stub
  // exposes that as a button so the close path is drivable.
  ResponsiveDialog: (props: { children?: JSX.Element; onOpenChange?: (open: boolean) => void }) => (
    <div>
      <button type="button" onClick={() => props.onOpenChange?.(false)}>
        Dismiss
      </button>
      {props.children}
    </div>
  ),
  ResponsiveDialogContent: passthrough,
  ResponsiveDialogHeader: passthrough,
  ResponsiveDialogTitle: passthrough,
  ResponsiveDialogDescription: passthrough,
  Button: (props: { children?: JSX.Element; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={() => props.onClick?.()} disabled={props.disabled}>
      {props.children}
    </button>
  ),
  SchemaForm: StubSchemaForm,
};

const configSchema = z.object({
  title: z.string().min(2).default("Lamp"),
});

function mount(config: Record<string, unknown> = { title: "Lamp" }) {
  const onConfigSave = vi.fn();
  const onOpenChange = vi.fn();
  render(() => (
    <WidgetDialog
      {...stubs}
      open
      activeTab="edit"
      onOpenChange={onOpenChange}
      title="Stub"
      configSchema={configSchema}
      config={config}
      onConfigSave={onConfigSave}
    />
  ));
  return { onConfigSave, onOpenChange };
}

const field = () => screen.getByLabelText("title") as HTMLInputElement;
const save = () => screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;

describe("WidgetDialog draft lifecycle", () => {
  it("renders the schema fields from the Zod config schema", () => {
    mount();
    expect(field().value).toBe("Lamp");
  });

  it("shows the edited value, not the value the dialog opened with", () => {
    mount();
    fireEvent.input(field(), { target: { value: "Desk lamp" } });
    expect(field().value).toBe("Desk lamp");
  });

  it("enables Save only once the draft differs from the stored config", () => {
    mount();
    expect(save().disabled).toBe(true);
    fireEvent.input(field(), { target: { value: "Desk lamp" } });
    expect(save().disabled).toBe(false);
  });

  it("saves the draft when it validates", () => {
    const { onConfigSave } = mount();
    fireEvent.input(field(), { target: { value: "Desk lamp" } });
    fireEvent.click(save());
    expect(onConfigSave).toHaveBeenCalledWith({ title: "Desk lamp" });
  });

  // The host's resolveConfig falls back to defaults on a parse failure, so an
  // invalid draft reaching onConfigSave silently wipes the user's config.
  it("blocks an invalid draft and surfaces the issue instead", () => {
    const { onConfigSave } = mount();
    fireEvent.input(field(), { target: { value: "x" } });
    fireEvent.click(save());

    expect(onConfigSave).not.toHaveBeenCalled();
    expect(document.querySelector('[data-slot="error"]')?.textContent).toContain("title");
  });

  it("drops the draft and stale errors when the dialog is dismissed", () => {
    const { onConfigSave, onOpenChange } = mount();
    fireEvent.input(field(), { target: { value: "x" } });
    fireEvent.click(save());
    expect(document.querySelector('[data-slot="error"]')).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfigSave).not.toHaveBeenCalled();
    expect(field().value).toBe("Lamp");
    expect(document.querySelector('[data-slot="error"]')).toBeNull();
  });

  // The host owns the stored config: a revert, an upgrade migration or another
  // device's edit replaces it under an open dialog, and the draft must follow.
  it("resets the draft when the host replaces the stored config", () => {
    const [config, setConfig] = createSignal<Record<string, unknown>>({ title: "Lamp" });
    render(() => (
      <WidgetDialog
        {...stubs}
        open
        activeTab="edit"
        onOpenChange={() => {}}
        title="Stub"
        configSchema={configSchema}
        config={config()}
        onConfigSave={() => {}}
      />
    ));

    fireEvent.input(field(), { target: { value: "Desk lamp" } });
    expect(save().disabled).toBe(false);

    setConfig({ title: "Reverted" });
    expect(field().value).toBe("Reverted");
    expect(save().disabled).toBe(true);
  });
});
