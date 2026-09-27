import {
  Badge,
  Button,
  ButtonGroup,
  Icon,
  ToggleGroup,
  ToggleGroupItem,
} from "@glasshome/ui/solid";
import {
  children,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  on,
  onCleanup,
  Show,
  useContext,
} from "solid-js";
import { type Confirm, useConfirm } from "../hooks/use-confirm";
import { WidgetCtx } from "../hooks/use-widget-context";
import { widgetRegistry } from "../hooks/widget-registry";
import { cn } from "../utils/cn";
import { WidgetIcon } from "./WidgetIcon";

/** True for a moment after `<Widget confirmed>`: the head icon and glyph read as a check. */
export const WidgetConfirmedCtx = createContext<() => boolean>(() => false);

const CHECK = "mdi:check";

export function WidgetHead(props: {
  /** Iconify name; also the icon the widget's sheet wears. */
  icon?: string;
  /** Small line above the name: a state, a count, a reading. Hidden when it repeats the name. */
  eyebrow?: JSX.Element;
  name: JSX.Element;
  /** Chips at the head's end, on tiles tall enough. */
  aside?: JSX.Element;
  /** Draws the icon in the widget's colour instead of muted. */
  active?: boolean;
  /** Entities behind the tile; 2 and 3 stack the icon. */
  count?: number;
}): JSX.Element {
  const confirmed = useContext(WidgetConfirmedCtx);
  const registry = widgetRegistry(useContext(WidgetCtx));
  createEffect(() => registry?.setIcon(props.icon));
  onCleanup(() => {
    if (registry?.icon() === props.icon) registry?.setIcon(undefined);
  });
  // Resolved once: reading a JSX prop twice (Show + body) rebuilds its DOM on every change.
  const eyebrow = children(() => props.eyebrow);
  const aside = children(() => props.aside);
  const repeatsName = () => {
    const e = eyebrow();
    return (
      typeof e === "string" &&
      typeof props.name === "string" &&
      e.trim().toLowerCase() === props.name.trim().toLowerCase()
    );
  };
  return (
    <div class="glasshome-widget-head">
      <Show when={props.icon}>
        {(icon) => (
          <WidgetIcon
            icon={<Icon icon={confirmed() ? CHECK : icon()} />}
            entityCount={props.count}
            color={props.active || confirmed() ? undefined : "var(--muted-foreground)"}
            class="glasshome-widget-head-icon"
          />
        )}
      </Show>
      <div class="glasshome-widget-head-text">
        <Show when={eyebrow() && !repeatsName()}>
          <span class="glasshome-widget-eyebrow">{eyebrow()}</span>
        </Show>
        <span class="glasshome-widget-name">{props.name}</span>
      </div>
      <Show when={aside()}>
        <div class="glasshome-widget-head-aside">{aside()}</div>
      </Show>
    </div>
  );
}

export function WidgetHero(props: {
  value: JSX.Element;
  unit?: string;
  /** Small line above the value. */
  sub?: JSX.Element;
  /** The tile's object art, bottom right, behind the words. */
  art?: JSX.Element;
  class?: string;
}): JSX.Element {
  const sub = children(() => props.sub);
  const art = children(() => props.art);
  // A new state ("Locked" to "Unlocked", "Off" to "80%") rises in; a reading whose digits tick does not.
  const wording = createMemo(() =>
    typeof props.value === "string" ? props.value.replace(/[\d\s.,:/%°+\-−]/g, "") : undefined,
  );
  const length = () =>
    typeof props.value === "string" || typeof props.value === "number"
      ? String(props.value).length + (props.unit ? 0.5 : 0)
      : undefined;
  const [turn, setTurn] = createSignal<"a" | "b" | undefined>();
  createEffect(on(wording, () => setTurn((t) => (t === "a" ? "b" : "a")), { defer: true }));
  return (
    <div
      class={cn("glasshome-widget-hero", props.class)}
      data-art={art() ? "" : undefined}
      data-empty={props.value === "" && !sub() ? "" : undefined}
    >
      <div class="glasshome-widget-reading">
        <Show when={sub()}>
          <span class="glasshome-widget-sub">{sub()}</span>
        </Show>
        <span
          class="glasshome-widget-reading-value"
          data-turn={turn()}
          style={{ "--value-len": length() }}
        >
          {props.value}
          <Show when={props.unit}>
            <span class="glasshome-widget-unit" data-degree={props.unit === "°" || undefined}>
              {props.unit}
            </span>
          </Show>
        </span>
      </div>
      <Show when={art()}>
        <div class="glasshome-widget-art">{art()}</div>
      </Show>
    </div>
  );
}

/** The tile's control row: beside the value on a wide tile, under it on a narrow one, hidden on a short one. */
export function WidgetControls(props: { children: JSX.Element }): JSX.Element {
  return (
    <div class="glasshome-widget-controls" on:pointerdown={(e) => e.stopPropagation()}>
      {props.children}
    </div>
  );
}

export function WidgetStepper(props: {
  label: string;
  onStep: (direction: -1 | 1) => void;
}): JSX.Element {
  return (
    <ButtonGroup aria-label={props.label} class="glasshome-widget-stepper">
      <Button
        variant="outline"
        size="icon"
        aria-label="Lower"
        class="glasshome-widget-control"
        onClick={() => props.onStep(-1)}
      >
        <Icon icon="mdi:minus" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Raise"
        class="glasshome-widget-control"
        onClick={() => props.onStep(1)}
      >
        <Icon icon="mdi:plus" />
      </Button>
    </ButtonGroup>
  );
}

export function WidgetChoice(props: {
  label: string;
  tone?: string;
  value: string;
  options: { value: string; icon: string; label: string }[];
  onChange: (value: string) => void;
}): JSX.Element {
  return (
    <ToggleGroup
      aria-label={props.label}
      tone={props.tone}
      value={props.value}
      onChange={(v: string | null) => v && props.onChange(v)}
      class="glasshome-widget-choice"
    >
      <For each={props.options}>
        {(o) => (
          <ToggleGroupItem
            value={o.value}
            aria-label={o.label}
            class="glasshome-widget-control"
            data-optional={o.value === props.value ? undefined : ""}
          >
            <Icon icon={o.icon} />
          </ToggleGroupItem>
        )}
      </For>
    </ToggleGroup>
  );
}

/**
 * A control for an action that leaves no state to show (run a scene, press a button, stop a blind):
 * it ticks after the call succeeds. Pass `confirm` to share one with the tile (`<Widget confirmed>`).
 */
export function WidgetAction(props: {
  icon: string;
  /** Visible label; without one the action is a square icon control named by `aria-label`. */
  children?: JSX.Element;
  "aria-label"?: string;
  run: () => unknown;
  confirm?: Confirm;
  /** Key within a shared `confirm`; defaults to the label or icon. */
  id?: string;
  class?: string;
}): JSX.Element {
  const own = useConfirm();
  const confirm = () => props.confirm ?? own;
  const key = () => props.id ?? props["aria-label"] ?? props.icon;
  const done = () => confirm().has(key());
  return (
    <Button
      variant="outline"
      size={props.children ? "default" : "icon"}
      aria-label={props["aria-label"]}
      class={cn(
        props.children ? "glasshome-widget-control-wide" : "glasshome-widget-control",
        props.class,
      )}
      data-confirmed={done() || undefined}
      onClick={() => void confirm().run([key()], props.run)}
    >
      <Icon icon={done() ? CHECK : props.icon} />
      {props.children}
    </Button>
  );
}

export function WidgetChip(props: {
  icon?: string;
  tone?: string;
  children: JSX.Element;
}): JSX.Element {
  return (
    <Badge tone={props.tone ?? "var(--muted-foreground)"} class="gap-1 tabular-nums">
      <Show when={props.icon}>{(icon) => <Icon icon={icon()} />}</Show>
      {props.children}
    </Badge>
  );
}

/** A layer over the whole tile, edge to edge and behind the words: a picture, a scene, a chart band. */
export function WidgetLayer(props: { class?: string; children: JSX.Element }): JSX.Element {
  return <div class={cn("glasshome-widget-layer", props.class)}>{props.children}</div>;
}

/** A picture behind the whole tile, under a scrim that keeps the words readable. */
export function WidgetBackdrop(props: { children: JSX.Element }): JSX.Element {
  return <div class="glasshome-widget-backdrop">{props.children}</div>;
}

/** The icon large and faint in the corner: all a compact tile shows, and a big tile without art. */
export function WidgetGlyph(props: { icon: string }): JSX.Element {
  const confirmed = useContext(WidgetConfirmedCtx);
  return (
    <div class="glasshome-widget-glyph" aria-hidden="true">
      <Icon icon={confirmed() ? CHECK : props.icon} />
    </div>
  );
}
