/**
 * Widget — main container component.
 *
 * Renders the shell (gradient, border highlight, channel vars) and provides
 * a minimal context (updateConfig, host RPC) plus the measured-size context
 * for `useWidgetDimensions()`. All visual scale (icon size, text size, padding, gap, content layout
 * direction, slider fill orientation) lives in pure CSS via container queries
 * on `.glasshome-widget`. The widget reacts to its own rendered box without
 * any JS measurement.
 */

import { Icon, Popover, PopoverContent } from "@glasshome/ui/solid";
import {
  type JSX,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
  useContext,
} from "solid-js";
import type { WidgetSliderFill as WidgetSliderFillType } from "../backgrounds/WidgetSliderFill";
import type { WidgetContent as WidgetContentType } from "../components/WidgetContent";
import type { WidgetIcon as WidgetIconType } from "../components/WidgetIcon";
import type { WidgetStatus as WidgetStatusType } from "../components/WidgetStatus";
import type { WidgetTitle as WidgetTitleType } from "../components/WidgetTitle";
import type { WidgetValue as WidgetValueType } from "../components/WidgetValue";
import { WIDGET_Z } from "../design-system/z-index";
import { type GestureHandlers, useWidgetGestures } from "../gestures/use-widget-gestures";
import { dialogOpeners } from "../hooks/use-widget-dialog";
import { deprecate } from "../../deprecations";
import { type ReactiveWidgetContext, WidgetCtx } from "../hooks/use-widget-context";
import { WidgetSizeCtx } from "../hooks/use-widget-dimensions";
import { REGISTRY_KEY, widgetRegistry } from "../hooks/widget-registry";
import * as Anatomy from "../components/anatomy";
import { WidgetConfirmedCtx } from "../components/anatomy";
import type { Tone } from "../theming/tone";
import { injectTokens } from "../theming/tokens";
import type { WidgetStyles, WidgetVariantConfig } from "../types";
import { cn } from "../utils/cn";
import { getBuiltInVariantStyles } from "../variants/built-in-variants";

interface WidgetEmptyStateConfig {
  icon?: JSX.Element;
  title?: string;
  message?: string;
}

interface WidgetProps {
  variant?: string | WidgetVariantConfig;
  /** Semantic tone; resolves to `--widget-color: var(--tone-{name})`. */
  tone?: Tone;
  /** CSS color override for `--widget-color`. Overrides `tone`. */
  color?: string;
  /** Second-stop gradient color (`--widget-color-to`). */
  colorTo?: string;
  /** @deprecated Use `color` + `colorTo`; a full gradient paints over the material. Removed in 2.0.0. */
  gradient?: string;
  loading?: boolean;
  class?: string;
  isEditMode?: boolean;
  onDelete?: () => void;
  emptyState?: WidgetEmptyStateConfig;
  /** Gesture handlers from `useWidgetGestures`. */
  gestures?: GestureHandlers;
  /** An action that leaves no state just ran: the head icon and glyph turn into a check for a moment. */
  confirmed?: boolean;
  children?: JSX.Element;
}

interface WidgetComponent {
  (props: WidgetProps): JSX.Element;
  Content: typeof WidgetContentType;
  Icon: typeof WidgetIconType;
  Title: typeof WidgetTitleType;
  Status: typeof WidgetStatusType;
  Value: typeof WidgetValueType;
  SliderFill: typeof WidgetSliderFillType;
  Head: typeof Anatomy.WidgetHead;
  Hero: typeof Anatomy.WidgetHero;
  Controls: typeof Anatomy.WidgetControls;
  Stepper: typeof Anatomy.WidgetStepper;
  Choice: typeof Anatomy.WidgetChoice;
  Action: typeof Anatomy.WidgetAction;
  Chip: typeof Anatomy.WidgetChip;
  Backdrop: typeof Anatomy.WidgetBackdrop;
  Layer: typeof Anatomy.WidgetLayer;
  Glyph: typeof Anatomy.WidgetGlyph;
}

const NOTHING_MORE_MS = 2000;

function WidgetBase(props: WidgetProps): JSX.Element {
  const parentCtx = useContext(WidgetCtx);
  // An empty tile says "Hold to configure": holding it opens the widget's settings, whatever the widget wired.
  const emptyGestures = useWidgetGestures(() => ({
    hold: {
      action: () =>
        (dialogOpeners.get(parentCtx ?? {}) ?? dialogOpeners.get(contextValue))?.("edit"),
    },
  }));
  onCleanup(emptyGestures.dispose);
  const registry = widgetRegistry(parentCtx);
  // The outermost <Widget> speaks for the widget; an empty one's hold opens settings, not "see more".
  const reportsHold = !!parentCtx && !(REGISTRY_KEY in parentCtx);
  // A widget that wires no gestures still holds: to its sheet, or to "nothing more here".
  const sheetGestures = useWidgetGestures(() => ({
    hold: registry?.hasSheet()
      ? {
          action: () => (dialogOpeners.get(parentCtx ?? {}) ?? dialogOpeners.get(contextValue))?.(),
        }
      : undefined,
  }));
  onCleanup(sheetGestures.dispose);
  const gestures = () =>
    props.emptyState && parentCtx
      ? emptyGestures
      : (props.gestures ?? (reportsHold ? sheetGestures : undefined));
  if (reportsHold) {
    createEffect(() => parentCtx?.onHoldable?.(!props.emptyState && !!gestures()?.holds?.()));
    onCleanup(() => parentCtx?.onHoldable?.(false));
  }
  createEffect(() => {
    if (!reportsHold || !registry?.nothingMore()) return;
    const timer = setTimeout(() => registry.setNothingMore(false), NOTHING_MORE_MS);
    onCleanup(() => clearTimeout(timer));
  });
  createEffect(() =>
    registry?.setTone(props.color ?? (props.tone ? `var(--tone-${props.tone})` : undefined)),
  );

  const [shellEl, setShellEl] = createSignal<HTMLDivElement | undefined>();

  // Measure the untransformed layout box. getBoundingClientRect (what
  // createElementSize uses) folds in ancestor transforms, so the grid's
  // fade-scale entry animation reports a scaled-down size — and since the
  // layout box itself never changes, the observer never fires again to
  // correct it. borderBoxSize is the transform-free layout box.
  const [measured, setMeasured] = createSignal({ width: 0, height: 0 });
  createEffect(() => {
    const el = shellEl();
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const box = entry.borderBoxSize?.[0];
      setMeasured(
        box
          ? { width: box.inlineSize, height: box.blockSize }
          : { width: entry.contentRect.width, height: entry.contentRect.height },
      );
    });
    ro.observe(el);
    onCleanup(() => ro.disconnect());
  });

  // Tokens must land in the widget's own root: the host renders widgets
  // inside closed shadow roots, where document-level styles can't reach.
  onMount(() => {
    const rootNode = shellEl()?.getRootNode();
    injectTokens(
      (typeof ShadowRoot !== "undefined" && rootNode instanceof ShadowRoot) ||
        (typeof Document !== "undefined" && rootNode instanceof Document)
        ? rootNode
        : undefined,
    );
  });

  const contextValue: ReactiveWidgetContext = {
    ...parentCtx,
    updateConfig: parentCtx?.updateConfig ?? (() => {}),
    dimensions: deprecate(() => measured(), "ctx.dimensions"),
  };
  // Parts read the widget's registry through this copy; point it back at the host's context.
  if (parentCtx) Object.defineProperty(contextValue, REGISTRY_KEY, { value: parentCtx });

  const variantStyles = createMemo((): WidgetStyles | undefined => {
    if (!props.variant) return undefined;
    if (typeof props.variant === "string") return getBuiltInVariantStyles(props.variant);
    return props.variant.styles;
  });

  const gradient = deprecate(() => props.gradient, "widget.gradient");

  const toned = () => (!!props.tone && props.tone !== "neutral") || !!props.color;

  const toneStyle = createMemo((): JSX.CSSProperties => ({
    ...(variantStyles()?.cssVars || {}),
    ...(props.tone ? { "--widget-color": `var(--tone-${props.tone})` } : {}),
    ...(props.color ? { "--widget-color": props.color } : {}),
    ...(toned() ? { "--glass-tone": "var(--widget-color)" } : {}),
  }));

  const channelStyle = createMemo((): JSX.CSSProperties => ({
    "container-type": "size",
    "container-name": "widget",
    "touch-action": gestures() && !props.isEditMode ? gestures()?.touchAction() : undefined,
    ...variantStyles()?.container,
    ...toneStyle(),
    ...(props.colorTo
      ? { "--widget-color-to": props.colorTo, "--glass-tone-2": props.colorTo }
      : {}),
    ...(props.gradient ? { "background-image": gradient() } : {}),
  }));

  // Solid's `on:event` directive binds once; we re-read gesture handlers at
  // dispatch time so edit-mode toggles take effect without rebinding.
  const gestureEnabled = () => !!gestures() && !props.isEditMode;
  const onPointerEnter = (e: PointerEvent) => {
    if (gestureEnabled()) gestures()?.onPointerEnter(e);
  };
  const onPointerDown = (e: PointerEvent) => {
    if (gestureEnabled()) gestures()?.onPointerDown(e);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (gestureEnabled()) gestures()?.onPointerMove(e);
  };
  const onPointerUp = (e: PointerEvent) => {
    if (gestureEnabled()) gestures()?.onPointerUp(e);
  };
  const onPointerCancel = (e: PointerEvent) => {
    if (gestureEnabled()) gestures()?.onPointerCancel(e);
  };

  const flood = () => gestures()?.hold?.() ?? null;
  // The drain plays where the fill grew, so the point outlives the hold.
  const floodPoint = { x: 0, y: 0, r: 0 };
  const holdFloodStyle = (h: { x: number; y: number; r: number } | null): JSX.CSSProperties => {
    if (h) Object.assign(floodPoint, { x: h.x, y: h.y, r: h.r });
    return {
      left: `${floodPoint.x}px`,
      top: `${floodPoint.y}px`,
      width: `${floodPoint.r * 2}px`,
      height: `${floodPoint.r * 2}px`,
      "z-index": WIDGET_Z.BACKGROUND,
    };
  };

  return (
    <WidgetCtx.Provider value={contextValue}>
      <WidgetConfirmedCtx.Provider value={() => props.confirmed === true}>
        <WidgetSizeCtx.Provider value={measured}>
          <div class="glasshome-widget-frame relative h-full w-full">
            <div
              ref={(el) => {
                setShellEl(el);
                // Gesture lib has its own size observer (used for "auto" slide
                // orientation); we just hand it the element.
                props.gestures?.bindElement(el);
                emptyGestures.bindElement(el);
              }}
              class={cn(
                "glasshome-widget glass",
                "relative h-full w-full overflow-hidden rounded-xl select-none",
                variantStyles()?.class,
                props.class,
              )}
              style={channelStyle()}
              data-toned={toned() ? "" : undefined}
              data-confirmed={props.confirmed || undefined}
              on:pointerenter={onPointerEnter}
              on:pointerdown={onPointerDown}
              on:pointermove={onPointerMove}
              on:pointerup={onPointerUp}
              on:pointercancel={onPointerCancel}
              tabIndex={gestureEnabled() ? 0 : undefined}
              onKeyDown={(e) => {
                if (gestureEnabled()) gestures()?.onKeyDown?.(e);
              }}
            >
              <Show when={gestures()?.hold}>
                <span
                  class="glasshome-widget-hold-flood"
                  aria-hidden="true"
                  data-hold={flood() && !flood()?.fired ? "" : undefined}
                  data-fired={flood()?.fired ? "" : undefined}
                  style={holdFloodStyle(flood())}
                />
              </Show>
              <div class="relative h-full w-full" style={{ "z-index": WIDGET_Z.CONTENT }}>
                {props.emptyState ? (
                  <WidgetEmptyStateInner
                    icon={props.emptyState.icon}
                    title={props.emptyState.title}
                    message={props.emptyState.message}
                  />
                ) : (
                  props.children
                )}
              </div>

              {props.loading && (
                <div
                  class="glasshome-widget-loading pointer-events-none absolute inset-0 animate-pulse"
                  style={{ "z-index": WIDGET_Z.OVERLAY }}
                />
              )}
            </div>
            <div
              class="glasshome-widget-halo glass-halo rounded-xl"
              style={toneStyle()}
              data-toned={toned() ? "" : undefined}
              aria-hidden="true"
            />
          </div>
          <Show when={reportsHold}>
            <Popover
              open={registry?.nothingMore() ?? false}
              onOpenChange={(open) => {
                if (!open) registry?.setNothingMore(false);
              }}
              anchorRef={shellEl}
            >
              <PopoverContent class="flex w-auto items-center gap-2 p-3 text-sm">
                <Icon icon="mdi:information-outline" />
                No more controls for this widget
              </PopoverContent>
            </Popover>
          </Show>
        </WidgetSizeCtx.Provider>
      </WidgetConfirmedCtx.Provider>
    </WidgetCtx.Provider>
  );
}

function WidgetEmptyStateInner(props: {
  icon?: JSX.Element;
  title?: string;
  message?: string;
}): JSX.Element {
  return (
    <div class="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
      {props.icon && (
        <div class="text-muted-foreground flex items-center justify-center">{props.icon}</div>
      )}
      {props.title && <h3 class="text-foreground text-sm font-semibold">{props.title}</h3>}
      {props.message && <p class="text-muted-foreground text-xs">{props.message}</p>}
    </div>
  );
}

import { WidgetSliderFill } from "../backgrounds/WidgetSliderFill";
import { WidgetContent } from "../components/WidgetContent";
import { WidgetIcon } from "../components/WidgetIcon";
import { WidgetStatus } from "../components/WidgetStatus";
import { WidgetTitle } from "../components/WidgetTitle";
import { WidgetValue } from "../components/WidgetValue";

export const Widget = WidgetBase as unknown as WidgetComponent;
Widget.Content = WidgetContent;
Widget.Icon = WidgetIcon;
Widget.Title = WidgetTitle;
Widget.Status = WidgetStatus;
Widget.Value = WidgetValue;
Widget.SliderFill = WidgetSliderFill;
Widget.Head = Anatomy.WidgetHead;
Widget.Hero = Anatomy.WidgetHero;
Widget.Controls = Anatomy.WidgetControls;
Widget.Stepper = Anatomy.WidgetStepper;
Widget.Choice = Anatomy.WidgetChoice;
Widget.Action = Anatomy.WidgetAction;
Widget.Chip = Anatomy.WidgetChip;
Widget.Backdrop = Anatomy.WidgetBackdrop;
Widget.Layer = Anatomy.WidgetLayer;
Widget.Glyph = Anatomy.WidgetGlyph;
