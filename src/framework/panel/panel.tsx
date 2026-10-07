import { Button, buttonVariants, HOLD_MS, Icon, spendLongPress } from "@glasshome/ui/solid";
import { For, type JSX, onCleanup, Show, useContext } from "solid-js";
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
  /** Keyboard step; the drag reports whole numbers. */
  step?: number;
}

const SLOP_PX = 8;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

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
  let held = false;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let last = 0;

  const valueAt = (el: HTMLElement, e: PointerEvent) => {
    const s = opts.slide?.();
    if (!s) return 0;
    const r = el.getBoundingClientRect();
    const t =
      opts.axis === "x" ? (e.clientX - r.left) / r.width : 1 - (e.clientY - r.top) / r.height;
    const lo = s.min ?? 0;
    const hi = s.max ?? 100;
    return Math.round(clamp(lo + t * (hi - lo), lo, hi));
  };

  const end = () => {
    clearTimeout(holdTimer);
    start = undefined;
  };
  onCleanup(() => clearTimeout(holdTimer));

  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.button !== 0 || start) return;
      const own = e.target instanceof Element ? e.target.closest(INTERACTIVE) : null;
      if (own && own !== e.currentTarget) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      // Captured from the press on, so the release always comes back here and clears `start`.
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      sliding = false;
      held = false;
      if (opts.onHold) {
        holdTimer = setTimeout(() => {
          held = true;
          spendLongPress();
          opts.onHold?.();
          ctx?.onHeld?.();
        }, HOLD_MS);
      }
    },
    onPointerMove: (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id || held) return;
      const el = e.currentTarget as HTMLElement;
      const d = opts.axis === "x" ? Math.abs(e.clientX - start.x) : Math.abs(e.clientY - start.y);
      if (!sliding && opts.slide?.() && d > SLOP_PX) {
        sliding = true;
        clearTimeout(holdTimer);
      }
      if (sliding) {
        last = valueAt(el, e);
        opts.slide?.()?.onChange(last);
      } else if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > SLOP_PX) {
        clearTimeout(holdTimer);
      }
    },
    onPointerUp: (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      if (sliding) opts.slide?.()?.onCommit?.(last);
      else if (!held) opts.onTap?.();
      end();
    },
    onPointerCancel: end,
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
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 5
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -5
          : 0;
    if (!step) return;
    e.preventDefault();
    const v = clamp(s.value + step, s.min ?? 0, s.max ?? 100);
    s.onChange(v);
    s.onCommit?.(v);
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
  return (
    <div class="glasshome-panel-row-wrap">
      <Show
        when={interactive()}
        fallback={
          <div
            class={`${buttonVariants({ variant: "outline", size: "none" })} glasshome-panel-row glasshome-panel-row-static`}
            style={tone()}
          >
            {body()}
          </div>
        }
      >
        <Button
          variant="outline"
          size="none"
          class="glasshome-panel-row"
          style={tone()}
          aria-label={props["aria-label"]}
          aria-pressed={props.on}
          onPointerDown={gestures.onPointerDown}
          onPointerMove={gestures.onPointerMove}
          onPointerUp={gestures.onPointerUp}
          onPointerCancel={gestures.onPointerCancel}
          onKeyDown={onKey}
          onClick={(e: MouseEvent) => {
            // Pointer taps land in onPointerUp; only a keyboard press reaches here with detail 0.
            if (e.detail === 0) props.onTap?.();
          }}
        >
          {body()}
        </Button>
      </Show>
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
