import {
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@glasshome/ui/solid";
import type {
  ModalSize,
  Button as UIButton,
  ResponsiveDialog as UIResponsiveDialog,
  ResponsiveDialogContent as UIResponsiveDialogContent,
  ResponsiveDialogDescription as UIResponsiveDialogDescription,
  ResponsiveDialogHeader as UIResponsiveDialogHeader,
  ResponsiveDialogTitle as UIResponsiveDialogTitle,
  SchemaForm as UISchemaForm,
} from "@glasshome/ui/solid";
import {
  type ComponentProps,
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  on,
  Show,
  splitProps,
} from "solid-js";
import type { ZodType } from "zod";
import { toFormSchema } from "../to-form-schema";
import { validateConfigDraft } from "./validate-config";

/** The JSON Schema dialect ui's SchemaForm accepts, sourced from ui itself. */
type SchemaFormSchema = ComponentProps<typeof UISchemaForm>["schema"];

/**
 * `toFormSchema` returns `object` (zod's JSON Schema output is untyped here).
 * The single narrowing point where that meets ui's declared schema type.
 */
const asFormSchema = (schema: ZodType): SchemaFormSchema =>
  toFormSchema(schema) as SchemaFormSchema;

/** Widths a widget could name before ui's modal size scale existed. */
type LegacyMaxWidth = "2xl" | "3xl" | "4xl";

const PANEL_SIZE: Record<ModalSize | LegacyMaxWidth, ModalSize> = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
  full: "full",
  "2xl": "xl",
  "3xl": "xl",
  "4xl": "full",
};

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
  /** Rendered under the title. Omitted panels are named by the title alone. */
  description?: JSX.Element;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
  onDelete?: () => void;
  editContent?: JSX.Element;
  controlsContent?: JSX.Element;
  debugContent?: JSX.Element;
  debugData?: string | Record<string, unknown>;
  tabs?: WidgetDialogTab[];
  class?: string;
  /** Panel width on desktop. `2xl`/`3xl`/`4xl` are deprecated aliases. */
  maxWidth?: ModalSize | LegacyMaxWidth;
  defaultTab?: string;
  /** Controlled active tab (pair with `onActiveTabChange`); overrides `defaultTab`. */
  activeTab?: string;
  onActiveTabChange?: (tab: string) => void;
  headerActions?: JSX.Element;
  // Schema-driven config editing (optional — replaces editContent when provided)
  configSchema?: ZodType;
  config?: Record<string, unknown>;
  onConfigSave?: (config: Record<string, unknown>) => void;

  // Injected UI primitives. Typed as the real @glasshome/ui components so a
  // prop-signature change in ui breaks tsc here instead of only at runtime.
  ResponsiveDialog: typeof UIResponsiveDialog;
  ResponsiveDialogContent: typeof UIResponsiveDialogContent;
  ResponsiveDialogHeader: typeof UIResponsiveDialogHeader;
  ResponsiveDialogTitle: typeof UIResponsiveDialogTitle;
  ResponsiveDialogDescription: typeof UIResponsiveDialogDescription;
  Button: typeof UIButton;
  SchemaForm?: typeof UISchemaForm;
  // Optional: a widget built against the older bag still mounts, and the
  // fallback is the same host module the bag would have carried.
  ResponsiveDialogBody?: typeof ResponsiveDialogBody;
  ResponsiveDialogFooter?: typeof ResponsiveDialogFooter;
  Tabs?: typeof Tabs;
  TabsList?: typeof TabsList;
  TabsTrigger?: typeof TabsTrigger;
  TabsContent?: typeof TabsContent;
}

export function WidgetDialog(props: WidgetDialogProps) {
  const [local] = splitProps(props, [
    "open",
    "onOpenChange",
    "title",
    "description",
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
    "activeTab",
    "onActiveTabChange",
    "headerActions",
    "configSchema",
    "config",
    "onConfigSave",
    "ResponsiveDialog",
    "ResponsiveDialogContent",
    "ResponsiveDialogHeader",
    "ResponsiveDialogTitle",
    "ResponsiveDialogDescription",
    "ResponsiveDialogBody",
    "ResponsiveDialogFooter",
    "Button",
    "SchemaForm",
    "Tabs",
    "TabsList",
    "TabsTrigger",
    "TabsContent",
  ]);

  // Schema-driven config editing: draft lifecycle
  const schemaMode = () =>
    !!local.configSchema && !!local.config && !!local.onConfigSave && !!local.SchemaForm;
  const [draftConfig, setDraftConfig] = createSignal<Record<string, unknown>>({});
  const [formSchema, setFormSchema] = createSignal<SchemaFormSchema | null>(null);
  const [configErrors, setConfigErrors] = createSignal<string[]>([]);

  // Reset draft when config changes or dialog opens
  createEffect(
    on(
      () => local.config,
      (config) => {
        if (config) setDraftConfig({ ...config });
      },
    ),
  );

  // Generate JSON Schema from Zod configSchema once
  createEffect(
    on(
      () => local.configSchema,
      (schema) => {
        if (schema) setFormSchema(asFormSchema(schema));
      },
    ),
  );

  const schemaDirty = () =>
    schemaMode() && JSON.stringify(draftConfig()) !== JSON.stringify(local.config);

  const handleSchemaClose = (open: boolean) => {
    if (!open && local.config) {
      setDraftConfig({ ...local.config });
      setConfigErrors([]);
    }
    local.onOpenChange(open);
  };

  // Invalid drafts must not reach onConfigSave: the host's resolveConfig
  // falls back to defaults on parse failure, silently wiping the config.
  const handleSchemaSave = () => {
    const schema = local.configSchema;
    if (schema) {
      const errors = validateConfigDraft(schema, draftConfig());
      if (errors) {
        setConfigErrors(errors);
        return;
      }
    }
    setConfigErrors([]);
    local.onConfigSave?.(draftConfig());
  };

  // Controlled when `activeTab`/`onActiveTabChange` provided; internal signal otherwise.
  const [internalTab, setInternalTab] = createSignal(local.defaultTab ?? "controls");
  const activeTab = () => local.activeTab ?? internalTab();
  const setActiveTab = (tab: string) => {
    if (local.onActiveTabChange) {
      local.onActiveTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const panelSize = () => PANEL_SIZE[local.maxWidth ?? "xl"];

  const resolvedTabs = (): WidgetDialogTab[] => {
    if (local.tabs) return local.tabs;

    const tabs: WidgetDialogTab[] = [];

    tabs.push({
      id: "edit",
      label: "Edit",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      content:
        local.editContent ??
        (() => {
          const SchemaFormEdit = local.SchemaForm;
          const schema = schemaMode() ? formSchema() : undefined;
          if (!schema || !SchemaFormEdit) {
            return (
              <div class="rounded-lg bg-muted/30 p-2 text-center md:p-6">
                <p class="text-muted-foreground text-sm">No edit options available</p>
              </div>
            );
          }
          return (
            <SchemaFormEdit
              schema={schema}
              // Tracked: SchemaForm is controlled, so a Select/Switch only
              // repaints when its data prop is a live read. builtTabs does not
              // depend on the draft, so this updates fields without a rebuild.
              data={draftConfig()}
              onChange={setDraftConfig}
              errors={configErrors()}
            />
          );
        })(),
    });

    tabs.push({
      id: "controls",
      label: "Controls",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
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

  const RD = local.ResponsiveDialog;
  const RDContent = local.ResponsiveDialogContent;
  const RDHeader = local.ResponsiveDialogHeader;
  const RDTitle = local.ResponsiveDialogTitle;
  const RDDescription = local.ResponsiveDialogDescription;
  const RDBody = local.ResponsiveDialogBody ?? ResponsiveDialogBody;
  const RDFooter = local.ResponsiveDialogFooter ?? ResponsiveDialogFooter;
  const TabsRoot = local.Tabs ?? Tabs;
  const TabsListPart = local.TabsList ?? TabsList;
  const TabsTriggerPart = local.TabsTrigger ?? TabsTrigger;
  const TabsContentPart = local.TabsContent ?? TabsContent;
  const Btn = local.Button;

  const builtTabs = createMemo(
    on(
      [() => local.open, formSchema, () => local.config, () => local.tabs],
      () => resolvedTabs(),
    ),
  );

  const effectiveOnOpenChange = (open: boolean) =>
    schemaMode() ? handleSchemaClose(open) : local.onOpenChange(open);
  const effectiveHasChanges = () =>
    schemaMode() ? schemaDirty() : local.hasUnsavedChanges;
  const effectiveOnSave = () => (schemaMode() ? handleSchemaSave : local.onSave);

  // Custom `tabs` ids need not include the "controls" default useWidgetDialog
  // starts on; the tab row falls back to the first tab, so the footer must too.
  const tabValue = () => {
    const tabs = builtTabs();
    const active = activeTab();
    return tabs.some((tab) => tab.id === active) ? active : (tabs[0]?.id ?? active);
  };

  const showFooter = () =>
    (tabValue() === "edit" && (effectiveOnSave() || local.onDelete)) ||
    (tabValue() === "debug" && local.debugData !== undefined);

  return (
    <RD open={local.open} onOpenChange={(open: boolean) => effectiveOnOpenChange(open)}>
      <RDContent size={panelSize()} class={local.class}>
        <TabsRoot value={tabValue()} onChange={setActiveTab} layout="split">
          {/* A phone leaves no room for the tab row beside the title, so the
              header wraps rather than truncating it away. */}
          <RDHeader
            class="flex-wrap"
            action={
              <>
                <TabsListPart class="w-auto">
                  <For each={builtTabs()}>
                    {(tab) => (
                      <TabsTriggerPart value={tab.id}>
                        <span class="inline-flex size-3.5 shrink-0 items-center">{tab.icon}</span>
                        {tab.label}
                      </TabsTriggerPart>
                    )}
                  </For>
                </TabsListPart>
                {local.headerActions}
              </>
            }
          >
            <RDTitle class="truncate">{local.title}</RDTitle>
            <Show when={local.description}>
              <RDDescription>{local.description}</RDDescription>
            </Show>
          </RDHeader>

          <RDBody>
            <For each={builtTabs()}>
              {(tab) => <TabsContentPart value={tab.id}>{tab.content}</TabsContentPart>}
            </For>
          </RDBody>

          <Show when={showFooter()}>
            <RDFooter>
              <Show when={tabValue() === "edit" && local.onDelete}>
                <Btn size="sm" variant="destructive" onClick={() => local.onDelete?.()}>
                  Delete
                </Btn>
              </Show>
              <Show when={tabValue() === "edit" && effectiveOnSave()}>
                <Btn
                  size="sm"
                  disabled={!effectiveHasChanges()}
                  onClick={() => effectiveOnSave()?.()}
                >
                  Save
                </Btn>
              </Show>
              <Show when={tabValue() === "debug" && local.debugData !== undefined}>
                <Btn size="sm" variant="outline" onClick={handleCopyDebug}>
                  Copy
                </Btn>
              </Show>
            </RDFooter>
          </Show>
        </TabsRoot>
      </RDContent>
    </RD>
  );
}
