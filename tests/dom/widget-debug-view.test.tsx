/**
 * The debug tab a widget gets without writing one, and the copy that has to
 * work on the plain-http origins most dashboards are reached on.
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
import { fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildDebugData,
  WidgetDebugTab,
} from "../../src/framework/dialogs/debug-view";
import { WidgetDialog } from "../../src/framework/dialogs/WidgetDialog";

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

const entity = {
  id: "light.desk",
  domain: "light",
  state: "on",
  friendlyName: "Desk lamp",
  deviceClass: null,
  areaId: "office",
  attributes: { brightness: 180 },
  lastChanged: new Date("2026-09-20T10:00:00Z"),
  lastUpdated: new Date("2026-09-20T10:05:00Z"),
  // biome-ignore lint/suspicious/noExplicitAny: fixture stands in for a full EntityView
} as any;

const data = () => buildDebugData({ title: "Desk" }, [entity], { uiBrightness: 71 });

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
}

afterEach(() => {
  setClipboard(undefined);
  vi.restoreAllMocks();
});

describe("WidgetDebugTab", () => {
  it("names the entity, its state and its extras", () => {
    render(() => <WidgetDebugTab data={data()} />);

    expect(screen.getByText("Desk lamp")).toBeTruthy();
    expect(screen.getByText("light.desk")).toBeTruthy();
    expect(screen.getByText("on")).toBeTruthy();
    expect(screen.getByText("Ui brightness")).toBeTruthy();
  });

  it("says so when a widget publishes nothing", () => {
    render(() => <WidgetDebugTab />);

    expect(screen.getByText("Nothing to inspect")).toBeTruthy();
  });

  it("copies from a section without a clipboard API", async () => {
    const exec = vi.fn(() => true);
    document.execCommand = exec;
    render(() => <WidgetDebugTab data={data()} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy Desk lamp" }));

    await waitFor(() => expect(exec).toHaveBeenCalledWith("copy"));
  });
});

describe("the dialog's copy action", () => {
  it("reports the copy it made", async () => {
    const writeText = vi.fn(async () => {});
    setClipboard({ writeText });
    render(() => (
      <WidgetDialog
        {...parts}
        open
        onOpenChange={() => {}}
        title="Lamp"
        activeTab="debug"
        debugData={data()}
      />
    ));

    fireEvent.click(screen.getByRole("button", { name: "Copy all" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy());
    expect(writeText).toHaveBeenCalledOnce();
  });

  it("reports the copy it could not make", async () => {
    setClipboard({
      writeText: async () => {
        throw new Error("denied");
      },
    });
    document.execCommand = vi.fn(() => false);
    render(() => (
      <WidgetDialog
        {...parts}
        open
        onOpenChange={() => {}}
        title="Lamp"
        activeTab="debug"
        debugData={data()}
      />
    ));

    fireEvent.click(screen.getByRole("button", { name: "Copy all" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Copy failed" })).toBeTruthy());
  });
});
