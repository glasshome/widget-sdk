import { compileCatalogSource } from "@glasshome/widget-contract/catalog-build";
import { SchemaForm } from "@glasshome/ui/solid";
import { render, screen } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { WidgetDialog } from "../../src/framework/dialogs/WidgetDialog";
import { WidgetLanguage } from "../../src/testing";

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
  SchemaForm,
};

const configSchema = z.object({ mode: z.string().meta({ title: "Mode" }) });
const english = compileCatalogSource("{}", "en.json");

function mount(catalog: ReturnType<typeof compileCatalogSource> | null) {
  render(() => (
    <WidgetLanguage language="fr" formatting="fr-FR" catalog={catalog} english={english}>
      <WidgetDialog
        {...stubs}
        open
        activeTab="edit"
        onOpenChange={() => {}}
        title="Heater"
        configSchema={configSchema}
        config={{ mode: "a" }}
        onConfigSave={vi.fn()}
      />
    </WidgetLanguage>
  ));
}

describe("the edit tab", () => {
  it("the edit tab shows the French title from the catalog", () => {
    mount(compileCatalogSource('{ "manifest.config.mode.title": "Mode de chauffe" }', "fr.json"));
    expect(screen.getByText("Mode de chauffe")).toBeTruthy();
  });

  it("the edit tab shows the schema's English with no catalog", () => {
    mount(null);
    expect(screen.getByText("Mode")).toBeTruthy();
  });
});
