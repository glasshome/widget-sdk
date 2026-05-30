/**
 * Widget — main container component.
 *
 * Renders the shell (gradient, border highlight, channel vars) and provides
 * a minimal context (isEditMode, updateConfig) for slot components and host
 * RPC. All visual scale (icon size, text size, padding, gap, content layout
 * direction, slider fill orientation) lives in pure CSS via container queries
 * on `.glasshome-widget`. The widget reacts to its own rendered box without
 * any JS measurement.
 */

import { createElementSize } from "@solid-primitives/resize-observer";
import { type JSX, createMemo, createSignal, onMount, useContext } from "solid-js";
import type { WidgetSliderFill as WidgetSliderFillType } from "../backgrounds/WidgetSliderFill";
import type { WidgetContent as WidgetContentType } from "../components/WidgetContent";
import type { WidgetIcon as WidgetIconType } from "../components/WidgetIcon";
import type { WidgetStatus as WidgetStatusType } from "../components/WidgetStatus";
import type { WidgetTitle as WidgetTitleType } from "../components/WidgetTitle";
import type { WidgetValue as WidgetValueType } from "../components/WidgetValue";
import { WIDGET_Z } from "../design-system/z-index";
import type { GestureHandlers } from "../gestures/use-widget-gestures";
import { type ReactiveWidgetContext, WidgetCtx } from "../hooks/use-widget-context";
import type { Tone } from "../theming/tone";
import { injectTokens } from "../theming/tokens";
import type { WidgetVariantConfig } from "../types";
import { cn } from "../utils/cn";
import { getBuiltInVariant } from "../variants";

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
  /** Full CSS gradient string (`--widget-gradient`); overrides the auto-shell. */
  gradient?: string;
  loading?: boolean;
  class?: string;
  isEditMode?: boolean;
  onDelete?: () => void;
  emptyState?: WidgetEmptyStateConfig;
  /** Gesture handlers from `useWidgetGestures`. */
  gestures?: GestureHandlers;
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
}

function WidgetBase(props: WidgetProps): JSX.Element {
  onMount(() => {
    injectTokens();
  });

  const parentCtx = useContext(WidgetCtx);

  const [shellEl, setShellEl] = createSignal<HTMLDivElement | undefined>();
  const measured = createElementSize(shellEl);

  const contextValue: ReactiveWidgetContext = {
    isEditMode: () => props.isEditMode ?? false,
    updateConfig: parentCtx?.updateConfig ?? (() => {}),
    dimensions: () => ({
      width: measured.width ?? 0,
      height: measured.height ?? 0,
    }),
  };

  const variantConfig = createMemo((): WidgetVariantConfig | undefined => {
    if (!props.variant) return undefined;
    if (typeof props.variant === "string") return getBuiltInVariant(props.variant);
    return props.variant;
  });

  const channelStyle = createMemo(
    (): JSX.CSSProperties => ({
      "container-type": "size",
      "container-name": "widget",
      "touch-action":
        props.gestures && !props.isEditMode ? props.gestures.touchAction() : undefined,
      ...variantConfig()?.styles?.container,
      ...(variantConfig()?.styles?.cssVars || {}),
      ...(props.tone ? { "--widget-color": `var(--tone-${props.tone})` } : {}),
      ...(props.color ? { "--widget-color": props.color } : {}),
      ...(props.colorTo ? { "--widget-color-to": props.colorTo } : {}),
      ...(props.gradient ? { "--widget-gradient": props.gradient } : {}),
    }),
  );

  // Solid's `on:event` directive binds once; we re-read gesture handlers at
  // dispatch time so edit-mode toggles take effect without rebinding.
  const gestureEnabled = () => !!props.gestures && !props.isEditMode;
  const onPointerEnter = (e: PointerEvent) => { if (gestureEnabled()) props.gestures?.onPointerEnter(e); };
  const onPointerDown = (e: PointerEvent) => { if (gestureEnabled()) props.gestures?.onPointerDown(e); };
  const onPointerMove = (e: PointerEvent) => { if (gestureEnabled()) props.gestures?.onPointerMove(e); };
  const onPointerUp = (e: PointerEvent) => { if (gestureEnabled()) props.gestures?.onPointerUp(e); };
  const onPointerCancel = (e: PointerEvent) => { if (gestureEnabled()) props.gestures?.onPointerCancel(e); };

  return (
    <WidgetCtx.Provider value={contextValue}>
      <div
        ref={(el) => {
          setShellEl(el);
          // Gesture lib has its own size observer (used for "auto" slide
          // orientation); we just hand it the element.
          props.gestures?.bindElement(el);
        }}
        class={cn(
          "glasshome-widget",
          "relative h-full w-full select-none overflow-hidden rounded-xl border border-border/50",
          variantConfig()?.styles?.class,
          props.class,
        )}
        style={channelStyle()}
        on:pointerenter={onPointerEnter}
        on:pointerdown={onPointerDown}
        on:pointermove={onPointerMove}
        on:pointerup={onPointerUp}
        on:pointercancel={onPointerCancel}
      >
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
      {props.icon && <div class="flex items-center justify-center text-white/30">{props.icon}</div>}
      {props.title && <h3 class="font-semibold text-sm text-white/60">{props.title}</h3>}
      {props.message && <p class="text-white/50 text-xs">{props.message}</p>}
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
