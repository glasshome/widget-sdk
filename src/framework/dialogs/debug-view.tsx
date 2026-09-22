import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  CountPill,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  FactRow,
  FieldGroup,
  FieldTitle,
  Icon,
  SectionIcon,
  SectionMeta,
  SectionRow,
} from "@glasshome/ui/solid";
import { createMemo, For, type JSX, Show } from "solid-js";
import type { EntityView } from "../types";
import { type CopyState, useCopyText } from "../utils/clipboard";

export interface WidgetDebugEntity {
  entity_id: string;
  state: string;
  domain: string;
  friendly_name?: string;
  device_class: string | null;
  area_id: string | null;
  last_changed: string;
  last_updated: string;
  attributes: Record<string, unknown>;
}

export interface WidgetDebugData {
  widgetConfig: Record<string, unknown>;
  entities: WidgetDebugEntity[];
  [key: string]: unknown;
}

export function buildDebugData(
  config: Record<string, unknown>,
  entities: EntityView[],
  extra?: Record<string, unknown>,
): WidgetDebugData {
  return {
    widgetConfig: config,
    entities: entities.map((entity) => ({
      entity_id: entity.id,
      state: entity.state,
      domain: entity.domain,
      friendly_name: entity.friendlyName,
      device_class: entity.deviceClass ?? null,
      area_id: entity.areaId,
      last_changed: entity.lastChanged.toISOString(),
      last_updated: entity.lastUpdated.toISOString(),
      attributes: entity.attributes,
    })),
    ...extra,
  };
}

const toJson = (value: unknown) => JSON.stringify(value, null, 2);

const COPY_ICON: Record<CopyState, string> = {
  idle: "lucide:copy",
  copied: "lucide:check",
  failed: "lucide:triangle-alert",
};

const COPY_TONE: Record<CopyState, string> = {
  idle: "text-muted-foreground",
  copied: "text-success",
  failed: "text-destructive",
};

function CopyIconButton(props: { label: string; text: () => string }) {
  const { state, copy } = useCopyText();
  return (
    <Button
      variant="ghost"
      size="icon"
      class="size-8"
      aria-label={props.label}
      onClick={() => void copy(props.text())}
    >
      <Icon icon={COPY_ICON[state()]} width={16} height={16} class={COPY_TONE[state()]} />
    </Button>
  );
}

function humanize(key: string): string {
  const spaced = key.replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

const isPrimitive = (value: unknown) => value === null || typeof value !== "object";

function factText(value: unknown): string {
  if (value === null || value === undefined) return "None";
  return String(value);
}

function size(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value !== null && typeof value === "object") return Object.keys(value).length;
  return 0;
}

function localTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function JsonBlock(props: { value: unknown }) {
  return (
    <SectionRow class="overflow-hidden p-0">
      <pre class="max-h-64 overflow-auto p-3 font-mono text-muted-foreground text-xs leading-relaxed">
        {toJson(props.value)}
      </pre>
    </SectionRow>
  );
}

function Disclosure(props: { label: string; count?: number; value: unknown }) {
  return (
    <Accordion collapsible class="border-border/50 border-t">
      <AccordionItem value={props.label}>
        <AccordionTrigger class="py-3 text-muted-foreground text-xs">
          <span class="flex items-center gap-2">
            {props.label}
            <Show when={props.count !== undefined}>
              <CountPill>{props.count}</CountPill>
            </Show>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <JsonBlock value={props.value} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/** Flat on the dialog body: the panel is the only card the debug tab has. */
function DebugSection(props: {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: JSX.Element;
  source: unknown;
  children: JSX.Element;
}) {
  return (
    <section class="flex min-w-0 flex-col gap-2">
      <header class="flex items-center gap-3">
        <SectionIcon icon={props.icon} size="sm" />
        <div class="flex min-w-0 flex-1 flex-col">
          <FieldTitle class="truncate">{props.title}</FieldTitle>
          <Show when={props.subtitle}>
            {(subtitle) => <SectionMeta class="truncate font-mono">{subtitle()}</SectionMeta>}
          </Show>
        </div>
        {props.badge}
        <CopyIconButton label={`Copy ${props.title}`} text={() => toJson(props.source)} />
      </header>
      <div class="flex flex-col gap-2">{props.children}</div>
    </section>
  );
}

function Facts(props: { record: Record<string, unknown> }) {
  const entries = createMemo(() => Object.entries(props.record));
  const flat = createMemo(() => entries().filter(([, value]) => isPrimitive(value)));
  const nested = createMemo(() => entries().filter(([, value]) => !isPrimitive(value)));
  return (
    <Show when={entries().length > 0} fallback={<SectionMeta>Nothing set</SectionMeta>}>
      <Show when={flat().length > 0}>
        <div class="flex flex-col">
          <For each={flat()}>
            {([key, value]) => <FactRow label={humanize(key)}>{factText(value)}</FactRow>}
          </For>
        </div>
      </Show>
      <For each={nested()}>
        {([key, value]) => <Disclosure label={humanize(key)} count={size(value)} value={value} />}
      </For>
    </Show>
  );
}

function EntitySection(props: { entity: WidgetDebugEntity }) {
  const attributes = () => props.entity.attributes ?? {};
  return (
    <DebugSection
      icon="lucide:activity"
      title={props.entity.friendly_name ?? props.entity.entity_id}
      subtitle={props.entity.entity_id}
      badge={<Badge>{props.entity.state}</Badge>}
      source={props.entity}
    >
      <div class="flex flex-col">
        <FactRow label="Domain">{props.entity.domain}</FactRow>
        <Show when={props.entity.device_class}>
          {(deviceClass) => <FactRow label="Device class">{deviceClass()}</FactRow>}
        </Show>
        <Show when={props.entity.area_id}>
          {(area) => <FactRow label="Area">{area()}</FactRow>}
        </Show>
        <FactRow label="Changed">{localTime(props.entity.last_changed)}</FactRow>
        <FactRow label="Updated">{localTime(props.entity.last_updated)}</FactRow>
      </div>
      <Show when={size(attributes()) > 0}>
        <Disclosure label="Attributes" count={size(attributes())} value={attributes()} />
      </Show>
    </DebugSection>
  );
}

export function WidgetDebugView(props: { data: WidgetDebugData }) {
  const extraKeys = createMemo(() =>
    Object.keys(props.data).filter((key) => key !== "widgetConfig" && key !== "entities"),
  );
  return (
    <FieldGroup>
      <DebugSection
        icon="lucide:sliders-horizontal"
        title="Configuration"
        source={props.data.widgetConfig}
      >
        <Facts record={props.data.widgetConfig} />
      </DebugSection>
      <For each={props.data.entities}>{(entity) => <EntitySection entity={entity} />}</For>
      <For each={extraKeys()}>
        {(key) => (
          <DebugSection icon="lucide:braces" title={humanize(key)} source={props.data[key]}>
            <JsonBlock value={props.data[key]} />
          </DebugSection>
        )}
      </For>
    </FieldGroup>
  );
}

function asDebugData(value: unknown): WidgetDebugData | undefined {
  if (value === null || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.entities) && typeof record.widgetConfig === "object"
    ? (record as unknown as WidgetDebugData)
    : undefined;
}

/** The debug tab a widget gets for free: the shaped view when its data came
 *  from buildDebugData, the raw payload otherwise. */
export function WidgetDebugTab(props: { data?: string | Record<string, unknown> }) {
  const shaped = createMemo(() => asDebugData(props.data));
  return (
    <Show
      when={props.data !== undefined}
      fallback={
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nothing to inspect</EmptyTitle>
            <EmptyDescription>This widget publishes no debug information.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    >
      <Show
        when={shaped()}
        fallback={
          <DebugSection icon="lucide:braces" title="Debug data" source={props.data}>
            <Show
              when={typeof props.data === "string"}
              fallback={<JsonBlock value={props.data} />}
            >
              <SectionRow class="overflow-hidden p-0">
                <pre class="max-h-96 overflow-auto whitespace-pre-wrap p-3 font-mono text-muted-foreground text-xs leading-relaxed">
                  {props.data as string}
                </pre>
              </SectionRow>
            </Show>
          </DebugSection>
        }
      >
        {(data) => <WidgetDebugView data={data()} />}
      </Show>
    </Show>
  );
}
