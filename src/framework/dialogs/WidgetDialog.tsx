import { createSignal, type JSX, type ParentComponent, Show, splitProps } from "solid-js";
import { cn } from "../utils/cn";

interface TabButtonProps {
  icon: JSX.Element;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton(props: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
      class={cn(
        "flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-xs transition-all duration-300 ease-in-out",
        props.isActive
          ? "gap-1.5 bg-foreground/10 font-semibold text-foreground shadow-sm"
          : "gap-0 text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      <Show when={props.isActive}>
        <span class="inline-flex size-3.5 shrink-0 items-center">{props.icon}</span>
      </Show>
      {props.label}
    </button>
  );
}

export interface WidgetDialogTab {
  id: string;
  label: string;
  icon: JSX.Element;
  content: JSX.Element;
}

export interface WidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
  onDelete?: () => void;
  editContent?: JSX.Element;
  controlsContent?: JSX.Element;
  debugContent?: JSX.Element;
  debugData?: string | Record<string, unknown>;
  tabs?: WidgetDialogTab[];
  class?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  defaultTab?: string;
  headerActions?: JSX.Element;
  ResponsiveDialog: ParentComponent<{ open: boolean; onOpenChange: (open: boolean) => void }>;
  ResponsiveDialogContent: ParentComponent<{ class?: string }>;
  ResponsiveDialogHeader: ParentComponent<{ class?: string }>;
  ResponsiveDialogTitle: ParentComponent<{ class?: string }>;
  ResponsiveDialogDescription: ParentComponent<{ class?: string }>;
  Button: ParentComponent<{
    size?: string;
    variant?: string;
    onClick?: () => void;
    class?: string;
  }>;
}

export function WidgetDialog(props: WidgetDialogProps) {
  const [local] = splitProps(props, [
    "open",
    "onOpenChange",
    "title",
    "onSave",
    "hasUnsavedChanges",
    "onDelete",
    "editContent",
    "controlsContent",
    "debugContent",
    "debugData",
    "tabs",
    "class",
    "maxWidth",
    "defaultTab",
    "headerActions",
    "ResponsiveDialog",
    "ResponsiveDialogContent",
    "ResponsiveDialogHeader",
    "ResponsiveDialogTitle",
    "ResponsiveDialogDescription",
    "Button",
  ]);

  const [activeTab, setActiveTab] = createSignal(local.defaultTab ?? "edit");

  const maxWidthClass = () => {
    const mw = local.maxWidth ?? "3xl";
    return {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      "3xl": "max-w-3xl",
      "4xl": "max-w-4xl",
    }[mw];
  };

  const resolvedTabs = (): WidgetDialogTab[] => {
    if (local.tabs) return local.tabs;

    const tabs: WidgetDialogTab[] = [];

    tabs.push({
      id: "edit",
      label: "Edit",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      content: local.editContent ?? (
        <div class="rounded-lg bg-muted/30 p-2 text-center md:p-6">
          <p class="text-muted-foreground text-sm">No edit options available</p>
        </div>
      ),
    });

    tabs.push({
      id: "controls",
      label: "Controls",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      ),
      content: local.controlsContent ?? (
        <div class="rounded-lg bg-muted/30 p-2 text-center md:p-6">
          <p class="text-muted-foreground text-sm">No additional controls</p>
        </div>
      ),
    });

    tabs.push({
      id: "debug",
      label: "Debug",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="m8 2 1.88 1.88" />
          <path d="M14.12 3.88 16 2" />
          <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
          <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
          <path d="M12 20v-9" />
          <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
          <path d="M6 13H2" />
          <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
          <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
          <path d="M22 13h-4" />
          <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
        </svg>
      ),
      content: local.debugContent ?? (
        <div class="rounded-lg bg-muted/30 p-2 text-center md:p-6">
          <p class="text-muted-foreground text-sm">No debug information available</p>
        </div>
      ),
    });

    return tabs;
  };

  const handleCopyDebug = async () => {
    if (local.debugData === undefined) return;
    try {
      const text =
        typeof local.debugData === "string"
          ? local.debugData
          : JSON.stringify(local.debugData, null, 2);
      await navigator.clipboard.writeText(text);
    } catch {
      // Silently fail
    }
  };

  const activeTabContent = () => {
    const tabs = resolvedTabs();
    const active = tabs.find((t) => t.id === activeTab());
    return active?.content ?? tabs[0]?.content;
  };

  const RD = local.ResponsiveDialog;
  const RDContent = local.ResponsiveDialogContent;
  const RDHeader = local.ResponsiveDialogHeader;
  const RDTitle = local.ResponsiveDialogTitle;
  const RDDescription = local.ResponsiveDialogDescription;
  const Btn = local.Button;

  return (
    <RD open={local.open} onOpenChange={local.onOpenChange}>
      <RDContent class={cn(maxWidthClass(), local.class)}>
        {/* Header: title on left, tabs + actions on right */}
        <RDHeader class="flex flex-row items-center justify-between gap-3">
          <div class="min-w-0 shrink-0">
            <RDTitle class="truncate leading-tight">{local.title}</RDTitle>
            <RDDescription class="sr-only">Widget configuration dialog</RDDescription>
          </div>

          <div class="flex items-center gap-2">
            {/* Tab buttons */}
            <div class="flex h-8 items-center rounded-lg border border-border/50 bg-muted/30 p-0.5">
              {resolvedTabs().map((tab) => (
                <TabButton
                  icon={tab.icon}
                  label={tab.label}
                  isActive={activeTab() === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>

            {/* Context actions */}
            <Show when={local.headerActions}>{local.headerActions}</Show>
            <Show when={activeTab() === "edit" && local.onSave && local.hasUnsavedChanges}>
              <Btn size="sm" onClick={() => local.onSave?.()}>
                Save
              </Btn>
            </Show>
            <Show when={activeTab() === "edit" && local.onDelete}>
              <Btn size="sm" variant="destructive" onClick={() => local.onDelete?.()}>
                Delete
              </Btn>
            </Show>
          </div>
        </RDHeader>

        {/* Tab content */}
        <div class="min-h-0 flex-1 overflow-y-auto p-2 md:p-6">{activeTabContent()}</div>

        <Show when={activeTab() === "debug" && local.debugData !== undefined}>
          <div class="flex shrink-0 justify-end pt-3">
            <Btn size="sm" variant="outline" onClick={handleCopyDebug}>
              Copy
            </Btn>
          </div>
        </Show>
      </RDContent>
    </RD>
  );
}
