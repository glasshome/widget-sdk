import { Button, buttonVariants, createHold, Icon } from "@glasshome/ui/solid";
import { For, type JSX, Match, onCleanup, Show, Switch, useContext } from "solid-js";
import { INTERACTIVE } from "../gestures/use-widget-gestures";
import { WidgetCtx } from "../hooks/use-widget-context";

/** A continuous value the whole stage (or a row) sets by dragging. */
export interface PanelSlide {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  /** Fires once when the drag ends, with the last value. */
  onCommit?: (value: number) => void;
  /** Names the value for screen readers and the keyboard handle ("Brightness"). */
  label?: string;
  /** The value moves in steps of this size, by drag and by keyboard. Unset: the drag reports whole numbers and a key moves 5. */
  step?: number;
}

const SLOP_PX = 8;
const KEY_STEP = 5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Rounded to the step's own decimals, so 0.5 steps never report 21.499999.
function snap(v: number, lo: number, step: number): number {
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Number((lo + Math.round((v - lo) / step) * step).toFixed(decimals));
}

/**
 * Tap, hold and slide on one element: a drag past the slop slides (horizontally
 * for rows, vertically for the stage), a short press taps, a long still press holds.
 */
function pointerGestures(opts: {
  axis: "x" | "y";
  slide?: () => PanelSlide | undefined;
  onTap?: () => void;
  onHold?: () => void;
}) {
  const ctx = useContext(WidgetCtx);
  let start: { x: number; y: number; id: number } | undefined;
  let sliding = false;
  const hold = createHold({
    slopPx: SLOP_PX,
    onHold: () => {
      opts.onHold?.();
      ctx?.onHeld?.();
    },
  });
  let last = 0;
  let from = 0;

  const valueAt = (el: HTMLElement, e: PointerEvent) => {
    const s = opts.slide?.();
    if (!s) return 0;
    const r = el.getBoundingClientRect();
    const t =
      opts.axis === "x" ? (e.clientX - r.left) / r.width : 1 - (e.clientY - r.top) / r.height;
    const lo = s.min ?? 0;
    const hi = s.max ?? 100;
    return clamp(snap(lo + t * (hi - lo), lo, s.step ?? 1), lo, hi);
  };

  const end = () => {
    hold.up();
    start = undefined;
  };
  onCleanup(() => hold.cancel());

  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.button !== 0 || start) return;
      const own = e.target instanceof Element ? e.target.closest(INTERACTIVE) : null;
      if (own && own !== e.currentTarget) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      // Captured from the press on, so the release always comes back here and clears `start`.
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      sliding = false;
      if (opts.onHold) hold.down(e);
    },
    onPointerMove: (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id || hold.fired()) return;
      hold.move(e);
      const el = e.currentTarget as HTMLElement;
      const d = opts.axis === "x" ? Math.abs(e.clientX - start.x) : Math.abs(e.clientY - start.y);
      const s = opts.slide?.();
      if (!sliding && s && d > SLOP_PX) {
        sliding = true;
        from = s.value;
      }
      if (sliding) {
        last = valueAt(el, e);
        opts.slide?.()?.onChange(last);
      }
    },
    onPointerUp: (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      if (sliding) opts.slide?.()?.onCommit?.(last);
      else if (!hold.fired()) opts.onTap?.();
      end();
    },
    // A cancelled slide sent nothing, so the value goes back to where the drag began.
    onPointerCancel: (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      if (sliding) opts.slide?.()?.onChange(from);
      end();
    },
  };
}

/** A labelled group in the panel's aside ("Lights", "Playing on"). */
export function PanelSection(props: { label: string; children: JSX.Element }): JSX.Element {
  return (
    <section class="glasshome-panel-section">
      <h3 class="glasshome-panel-label">{props.label}</h3>
      {props.children}
    </section>
  );
}

/** Rows side by side, as many as fit (three lamps, two blinds). */
export function PanelRows(props: { children: JSX.Element }): JSX.Element {
  return <div class="glasshome-panel-rows">{props.children}</div>;
}

export interface PanelRowProps {
  icon: string;
  name: string;
  /** The small line under the name ("70%", "Heating to 22°"). */
  state?: JSX.Element;
  /** The device's tone; tints its icon and fill while it is on. */
  tone?: string;
  on: boolean;
  /** 0-100 fill; dragging across the row sets it. */
  slide?: PanelSlide;
  /** A 0-100 fill for a row that only reads (a battery level, a share of power). */
  fill?: number;
  onTap?: () => void;
  onHold?: () => void;
  /** A control at the row's end (Unlock, + Add). */
  trailing?: JSX.Element;
  "aria-label"?: string;
}

/**
 * One device: a small tile made of button glass. Tap switches it, drag sets its level.
 * A row with nothing to press (no tap, slide or hold) wears the same glass but is not a button.
 */
export function PanelRow(props: PanelRowProps): JSX.Element {
  const interactive = () => !!(props.onTap || props.slide || props.onHold);
  const gestures = pointerGestures({
    axis: "x",
    slide: () => props.slide,
    onTap: () => props.onTap?.(),
    onHold: props.onHold ? () => props.onHold?.() : undefined,
  });
  const fill = () => {
    if (props.fill !== undefined) return props.fill;
    const s = props.slide;
    if (!s || !props.on) return undefined;
    const lo = s.min ?? 0;
    const hi = s.max ?? 100;
    return ((s.value - lo) / (hi - lo || 1)) * 100;
  };
  const onKey = (e: KeyboardEvent) => {
    const s = props.slide;
    if (!s) return;
    const by = s.step ?? KEY_STEP;
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? by
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -by
          : 0;
    if (!step) return;
    e.preventDefault();
    const lo = s.min ?? 0;
    const v = clamp(snap(s.value + step, lo, s.step ?? 1), lo, s.max ?? 100);
    s.onChange(v);
    s.onCommit?.(v);
  };
  const gestureProps = {
    onPointerDown: gestures.onPointerDown,
    onPointerMove: gestures.onPointerMove,
    onPointerUp: gestures.onPointerUp,
    onPointerCancel: gestures.onPointerCancel,
    onKeyDown: onKey,
  };
  const body = () => (
    <>
      <Show when={fill() !== undefined}>
        <span
          class="glasshome-widget-slider-fill glasshome-panel-row-fill"
          style={{ "--widget-fill-value": fill() } as JSX.CSSProperties}
        />
      </Show>
      <span
        class="glasshome-widget-icon glass glasshome-panel-row-icon"
        classList={{
          "glass-tint": props.on,
          "glasshome-panel-row-icon-off": !props.on,
        }}
      >
        <Icon icon={props.icon} class="glasshome-widget-icon-glyph" />
      </span>
      <span class="glasshome-panel-row-text">
        <span class="glasshome-panel-row-name">{props.name}</span>
        <Show when={props.state !== undefined}>
          <span class="glasshome-panel-row-state">{props.state}</span>
        </Show>
      </span>
    </>
  );
  const tone = () =>
    ({ "--widget-color": props.tone ?? "var(--tone-neutral)" }) as JSX.CSSProperties;
  const glass = buttonVariants({ variant: "outline", size: "none" });
  return (
    <div class="glasshome-panel-row-wrap">
      <Switch
        fallback={
          <div class={`${glass} glasshome-panel-row glasshome-panel-row-static`} style={tone()}>
            {body()}
          </div>
        }
      >
        <Match when={!props.onTap && !props.onHold && props.slide}>
          {(s) => (
            // Sliding is all this row does, so it is a slider; a row that also taps stays a button.
            <div
              role="slider"
              tabIndex={0}
              class={`${glass} glasshome-panel-row`}
              style={tone()}
              aria-label={
                props["aria-label"] ?? (s().label ? `${props.name}, ${s().label}` : props.name)
              }
              aria-valuemin={s().min ?? 0}
              aria-valuemax={s().max ?? 100}
              aria-valuenow={s().value}
              aria-valuetext={typeof props.state === "string" ? props.state : undefined}
              {...gestureProps}
            >
              {body()}
            </div>
          )}
        </Match>
        <Match when={interactive()}>
          <Button
            variant="outline"
            size="none"
            class="glasshome-panel-row"
            style={tone()}
            aria-label={props["aria-label"]}
            aria-pressed={props.on}
            {...gestureProps}
            onClick={(e: MouseEvent) => {
              // Pointer taps land in onPointerUp; only a keyboard press reaches here with detail 0.
              if (e.detail === 0) props.onTap?.();
            }}
          >
            {body()}
          </Button>
        </Match>
      </Switch>
      <Show when={props.trailing}>
        <span class="glasshome-panel-row-trailing">{props.trailing}</span>
      </Show>
    </div>
  );
}

export interface PanelFact {
  icon: string;
  label: string;
  value: JSX.Element;
}

/** Readings in one strip (window, CO₂, motion): read, never pressed. */
export function PanelFacts(props: { items: PanelFact[] }): JSX.Element {
  return (
    <div class="glasshome-panel-facts glass">
      <For each={props.items}>
        {(f) => (
          <div class="glasshome-panel-fact">
            <Icon icon={f.icon} class="glasshome-panel-fact-icon" />
            <span class="glasshome-panel-row-text">
              <span class="glasshome-panel-fact-label">{f.label}</span>
              <span class="glasshome-panel-fact-value">{f.value}</span>
            </span>
          </div>
        )}
      </For>
    </div>
  );
}
