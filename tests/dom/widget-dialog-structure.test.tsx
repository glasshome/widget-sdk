/**
 * The dialog's shell against the real ui modal parts: the panel clips, the Body
 * scrolls, the Footer is pinned, and the tab row is the package Tabs. The draft
 * lifecycle is covered separately against stub primitives.
 */

import {
  Button,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@glasshome/ui/solid";
import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { WidgetDialog, type WidgetDialogProps } from "../../src/framework/dialogs/WidgetDialog";
import { WidgetCtx } from "../../src/framework/hooks/use-widget-context";

const parts = {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
};

/** The tab row is Developer Mode's; the shell tests below read it, so they mount as a developer. */
function mount(extra: Partial<WidgetDialogProps> = {}, developer = true) {
  const ctx = {
    updateConfig: () => {},
    dimensions: () => ({ width: 0, height: 0 }),
    developer: () => developer,
  };
  return render(() => (
    <WidgetCtx.Provider value={ctx}>
      <WidgetDialog
        {...parts}
        open
        onOpenChange={() => {}}
        title="Lamp"
        activeTab="edit"
        onSave={() => {}}
        editContent={<p>edit pane</p>}
        {...extra}
      />
    </WidgetCtx.Provider>
  ));
}

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const panel = () => {
  const el = slot("dialog-content");
  if (!el) throw new Error("panel did not render");
  return el;
};

const scrollersInPanel = () =>
  [...panel().querySelectorAll<HTMLElement>("*")].filter((el) =>
    el.className.includes("overflow-y-auto"),
  );

describe("WidgetDialog shell", () => {
  it("renders the tab row as the package Tabs", () => {
    mount();

    const triggers = [...document.querySelectorAll('[data-slot="tabs-trigger"]')];
    expect(triggers.map((t) => t.textContent)).toEqual(["Edit", "Controls", "Debug"]);
  });

  it("puts the tab row in the header action, beside the title", () => {
    mount();

    const action = slot("responsive-dialog-header-action");
    expect(action?.querySelector('[data-slot="tabs-list"]')).toBeTruthy();
    expect(slot("responsive-dialog-header-text")?.textContent).toContain("Lamp");
  });

  it("puts the widget's own header actions beside the tab row", () => {
    mount({ headerActions: <button type="button">Refresh</button> });

    const action = slot("responsive-dialog-header-action");
    expect(action?.querySelector('[data-slot="tabs-list"]')).toBeTruthy();
    expect(action?.textContent).toContain("Refresh");
  });

  it("scrolls in the Body and nowhere else inside the panel", () => {
    mount();

    expect(scrollersInPanel()).toEqual([slot("responsive-dialog-body")]);
    expect(slot("responsive-dialog-body")?.textContent).toContain("edit pane");
  });

  it("leaves the panel padding to the parts", () => {
    mount();

    expect(panel().className).not.toContain("px-0");
    expect(panel().className).not.toContain("px-6");
  });

  it("pins the footer outside the scroller", () => {
    mount();

    const footer = slot("responsive-dialog-footer");
    expect(footer).toBeTruthy();
    expect(slot("responsive-dialog-body")?.contains(footer ?? null)).toBe(false);
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("drops the footer on a tab that has no action", () => {
    mount({ activeTab: "controls", controlsContent: <p>controls pane</p> });

    expect(slot("responsive-dialog-footer")).toBeNull();
  });

  it("maps the deprecated 3xl width onto the xl panel size", () => {
    mount({ maxWidth: "3xl" });

    expect(panel().className).toContain("max-w-3xl");
  });

  it("takes a modal size name straight through", () => {
    mount({ maxWidth: "sm" });

    expect(panel().className).toContain("max-w-sm");
  });

  // useWidgetDialog opens on "controls", which a widget's own tab ids need not
  // contain. The tab row falls back to the first tab, so everything keyed on the
  // active tab must read that same fallback or the footer serves another pane.
  it("falls back to the first tab when the active id names no tab", () => {
    render(() => (
      <WidgetDialog
        {...parts}
        open
        onOpenChange={() => {}}
        title="Custom"
        activeTab="controls"
        onSave={() => {}}
        onDelete={() => {}}
        tabs={[
          { id: "edit", label: "Ex", icon: <span />, content: <p>ex pane</p> },
          { id: "styles", label: "Why", icon: <span />, content: <p>why pane</p> },
        ]}
      />
    ));

    expect(document.querySelector('[data-slot="tabs-trigger"][data-selected]')?.textContent).toBe(
      "Ex",
    );
    expect(slot("responsive-dialog-body")?.textContent).toContain("ex pane");
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });

  it("honours an active tab id that does name one of the widget's tabs", () => {
    render(() => (
      <WidgetDialog
        {...parts}
        open
        onOpenChange={() => {}}
        title="Custom"
        onSave={() => {}}
        activeTab="styles"
        tabs={[
          { id: "edit", label: "Ex", icon: <span />, content: <p>ex pane</p> },
          { id: "styles", label: "Why", icon: <span />, content: <p>why pane</p> },
        ]}
      />
    ));

    expect(slot("responsive-dialog-body")?.textContent).toContain("why pane");
    expect(slot("responsive-dialog-footer")).toBeNull();
  });

  it("describes the panel only when the widget supplies a description", () => {
    mount();
    expect(slot("dialog-description")).toBeNull();
  });

  it("renders a real description when the widget supplies one", () => {
    mount({ description: "Pick the lamp this card drives." });

    expect(slot("dialog-description")?.textContent).toBe("Pick the lamp this card drives.");
  });
});

describe("WidgetDialog for a homeowner", () => {
  it("shows no tab row and no Debug outside Developer Mode", () => {
    mount({}, false);

    expect(slot("tabs-list")).toBeNull();
    expect(screen.queryByText("Debug")).toBeNull();
    expect(screen.getByText("edit pane")).toBeTruthy();
  });

  it("lands on the settings when asked for Debug outside Developer Mode", () => {
    mount({ activeTab: "debug", debugData: { a: 1 } }, false);

    expect(screen.getByText("edit pane")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Copy all" })).toBeNull();
  });

  it("opens a held tile's sheet with its title and no tabs", () => {
    mount({ activeTab: "controls", sheet: <div>the extras</div> }, false);

    expect(screen.getByText("the extras")).toBeTruthy();
    expect(screen.getByText("Lamp")).toBeTruthy();
    expect(slot("tabs-list")).toBeNull();
    expect(screen.queryByText("edit pane")).toBeNull();
  });

  it("opens the sheet beside the tile when the host gives the tile's box", () => {
    const tile = document.createElement("div");
    document.body.appendChild(tile);
    const ctx = {
      updateConfig: () => {},
      dimensions: () => ({ width: 0, height: 0 }),
      anchor: () => tile,
    };
    render(() => (
      <WidgetCtx.Provider value={ctx}>
        <WidgetDialog
          {...parts}
          open
          onOpenChange={() => {}}
          title="Lamp"
          activeTab="controls"
          sheet={<div>the extras</div>}
        />
      </WidgetCtx.Provider>
    ));

    const sheet = panel();
    expect(sheet.textContent).toContain("the extras");
    expect(sheet.classList.contains("glasshome-sheet-beside")).toBe(true);
    expect(sheet.style.left).not.toBe("");
  });

  it("lands on the settings when a widget with nothing extra is opened", () => {
    mount({ activeTab: "controls" }, false);

    expect(screen.getByText("edit pane")).toBeTruthy();
  });

  it("opens edit mode on the settings even when the widget has a sheet", () => {
    mount({ activeTab: "edit", sheet: <div>the extras</div> }, false);

    expect(screen.getByText("edit pane")).toBeTruthy();
    expect(screen.queryByText("the extras")).toBeNull();
  });

  it("builds no sheet while the dialog is closed", () => {
    let built = 0;
    const Panel = () => {
      built++;
      return <div>the panel</div>;
    };
    // A getter, as the JSX attribute `sheet={<Panel />}` compiles to.
    mount(
      {
        open: false,
        activeTab: "controls",
        get sheet() {
          return <Panel />;
        },
      },
      false,
    );

    expect(built).toBe(0);
  });
});
