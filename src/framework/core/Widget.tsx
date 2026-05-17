/**
 * Widget - Main Container Component
 *
 * The primary container for all widgets. Provides context, gesture handling,
 * and base styling.
 *
 * @example Simple widget
 * ```tsx
 * <Widget gestures={{ tap: handleTap }}>
 *   <Widget.Icon icon={<Power />} />
 *   <Widget.Title>{title}</Widget.Title>
 * </Widget>
 * ```
 *
 * @example With CSS gradient and loading
 * ```tsx
 * <Widget gradient="linear-gradient(135deg, oklch(0.7 0.2 30), oklch(0.5 0.18 270))" loading={isLoading}>
 *   {children}
 * </Widget>
 * ```
 */

import { createElementSize } from "@solid-primitives/resize-observer";
import { createEffect, createMemo, createSignal, type JSX, onMount, untrack, useContext } from "solid-js";
import type { WidgetSliderFill as WidgetSliderFillType } from "../backgrounds/WidgetSliderFill";
// Import slot component types for compound interface
import type { WidgetContent as WidgetContentType } from "../components/WidgetContent";
import type { WidgetIcon as WidgetIconType } from "../components/WidgetIcon";
import type { WidgetStatus as WidgetStatusType } from "../components/WidgetStatus";
import type { WidgetTitle as WidgetTitleType } from "../components/WidgetTitle";
import type { WidgetValue as WidgetValueType } from "../components/WidgetValue";
import { WIDGET_Z } from "../design-system/z-index";
import type { GestureHandlers } from "../gestures/use-widget-gestures";
import { type BridgeableWidgetContext, type ReactiveWidgetContext, WidgetCtx } from "../hooks/use-widget-context";
import type {
  WidgetDimensions,
  WidgetOrientation,
  WidgetSize,
  WidgetVariantConfig,
} from "../types";
import type { Tone } from "../theming/tone";
import { injectTokens } from "../theming/tokens";
import { cn } from "../utils/cn";
import { getBuiltInVariant } from "../variants";

interface WidgetEmptyStateConfig {
  /** Icon to display */
  icon?: JSX.Element;
  /** Main title/heading */
  title?: string;
  /** Descriptive message */
  message?: string;
}

interface WidgetProps {
  /** Widget variant (string ID or inline config) */
  variant?: string | WidgetVariantConfig;
  /**
   * Semantic tone (success, warning, danger, info, neutral, accent).
   * Resolves to `--widget-color: var(--tone-{name})` inline on the widget root.
   * Phase 26 channel API, preferred path for state-driven semantic widgets.
   */
  tone?: Tone;
  /**
   * CSS color string (oklch, hsl, hex, rgb, var()).
   * Sets `--widget-color` directly. Overrides `tone` when both supplied.
   */
  color?: string;
  /**
   * Optional second-stop CSS color string for two-stop gradient identity.
   * Sets `--widget-color-to`. When omitted the shell formula falls back to `--widget-color`.
   */
  colorTo?: string;
  /**
   * Full CSS gradient string (e.g. `linear-gradient(135deg, oklch(...), oklch(...))`).
   * Sets `--widget-gradient` and overrides the auto-derived shell gradient verbatim.
   * BREAKING (Phase 26): previously accepted Tailwind class strings; now expects raw CSS.
   */
  gradient?: string;
  /** Show loading overlay */
  loading?: boolean;
  /** Additional CSS classes */
  class?: string;
  /** Is edit mode (disables gestures) */
  isEditMode?: boolean;
  /** Called when delete button is clicked (only shown in edit mode) */
  onDelete?: () => void;
  /** Empty state configuration, when provided shows empty state UI inside the shell */
  emptyState?: WidgetEmptyStateConfig;
  /**
   * Gesture handlers from `useWidgetGestures`. When provided, Widget binds
   * pointer events on its outer container and wires the size observer so
   * widget authors don't need a gesture wrapper div. Suppressed in edit mode.
   */
  gestures?: GestureHandlers;
  /** Child elements */
  children?: JSX.Element;
}

// Extend Widget interface with slot components
interface WidgetComponent {
  (props: WidgetProps): JSX.Element;
  Content: typeof WidgetContentType;
  Icon: typeof WidgetIconType;
  Title: typeof WidgetTitleType;
  Status: typeof WidgetStatusType;
  Value: typeof WidgetValueType;
  SliderFill: typeof WidgetSliderFillType;
}

/**
 * Classify widget size based on grid dimensions
 */
function classifySize(gridWidth: number, gridHeight: number): WidgetSize {
  const area = gridWidth * gridHeight;

  if (area <= 2) return "xs"; // 1x1, 1x2
  if (area <= 4) return "sm"; // 2x1, 2x2
  if (area <= 8) return "md"; // 2x3, 2x4
  if (area <= 18) return "lg"; // 2x6, 3x6, 4x2
  return "xl"; // 4x4 and larger
}

/**
 * Detect orientation from dimensions based on aspect ratio
 * Used for gesture direction (slide horizontal vs vertical)
 */
function detectOrientation(width: number, height: number): WidgetOrientation {
  if (width > height) return "horizontal";
  if (height > width) return "vertical";
  return "square";
}

/**
 * Detect content layout direction
 * Used for UI arrangement (stack vertically vs horizontally)
 * Considers height threshold - tall widgets benefit from vertical stacking
 */
function detectContentLayout(width: number, height: number): WidgetOrientation {
  // If widget is tall enough (150px+), use vertical layout for better content flow
  if (height >= 150) return "vertical";

  // Otherwise use aspect ratio
  if (width > height) return "horizontal";
  if (height > width) return "vertical";
  return "square";
}

/**
 * Main Widget container component
 */
function WidgetBase(props: WidgetProps): JSX.Element {
  onMount(() => { injectTokens(); });

  let containerRef!: HTMLDivElement;

  // Track container size reactively via @solid-primitives/resize-observer
  const elementSize = createElementSize(() => containerRef);

  // Stable width/height signals with threshold-based debouncing.
  // Only update when the size changes by more than 2px, filtering out
  // sub-pixel jitter that would otherwise cascade through downstream
  // memos (sizeClass, orientation, contentLayout).
  const RESIZE_THRESHOLD = 2;
  const [stableWidth, setStableWidth] = createSignal(0);
  const [stableHeight, setStableHeight] = createSignal(0);

  createEffect(() => {
    const w = Math.round(elementSize.width ?? 0);
    const h = Math.round(elementSize.height ?? 0);
    const prevW = untrack(stableWidth);
    const prevH = untrack(stableHeight);
    if (Math.abs(w - prevW) > RESIZE_THRESHOLD || Math.abs(h - prevH) > RESIZE_THRESHOLD) {
      setStableWidth(w);
      setStableHeight(h);
    }
  });

  // Resolve variant configuration
  const variantConfig = createMemo((): WidgetVariantConfig | undefined => {
    if (!props.variant) return undefined;
    if (typeof props.variant === "string") {
      return getBuiltInVariant(props.variant);
    }
    return props.variant;
  });

  // Compute dimensions reactively from stable (debounced) width/height.
  // Custom equality prevents downstream memos (sizeClass, orientation, contentLayout)
  // from re-running when pixel values change but grid dimensions stay the same.
  const dimensions = createMemo(
    (): WidgetDimensions => ({
      width: stableWidth(),
      height: stableHeight(),
      gridWidth: Math.max(1, Math.round(stableWidth() / 150)),
      gridHeight: Math.max(1, Math.round(stableHeight() / 75)),
    }),
    undefined,
    {
      equals: (a, b) =>
        a.width === b.width &&
        a.height === b.height &&
        a.gridWidth === b.gridWidth &&
        a.gridHeight === b.gridHeight,
    },
  );

  // Derived size class
  const sizeClass = createMemo((): WidgetSize => {
    const d = dimensions();
    return classifySize(d.gridWidth, d.gridHeight);
  });

  // Derived orientation
  const orientation = createMemo((): WidgetOrientation => {
    const d = dimensions();
    return detectOrientation(d.width, d.height);
  });

  // Derived content layout
  const contentLayout = createMemo((): WidgetOrientation => {
    const d = dimensions();
    return detectContentLayout(d.width, d.height);
  });

  // Create reactive context value
  // Inherit updateConfig from parent context if available
  const parentCtx = useContext(WidgetCtx);

  // Bridge: if parent context is a bridgeable stub (created by WidgetSlot),
  // write real measured values into it so widget authors calling useWidgetContext()
  // at the top level get reactive values after Widget mounts.
  const bridgeable = parentCtx as BridgeableWidgetContext | undefined;
  if (bridgeable?._isStub?.() && bridgeable._bridge) {
    createEffect(() => { bridgeable._bridge.setSize(sizeClass()); });
    createEffect(() => { bridgeable._bridge.setOrientation(orientation()); });
    createEffect(() => { bridgeable._bridge.setContentLayout(contentLayout()); });
    createEffect(() => { bridgeable._bridge.setDimensions(dimensions()); });
    createEffect(() => { bridgeable._bridge.setIsStub(false); });
  }

  const contextValue: ReactiveWidgetContext = {
    size: sizeClass,
    orientation,
    contentLayout,
    dimensions,
    isEditMode: () => props.isEditMode ?? false,
    updateConfig: parentCtx?.updateConfig ?? (() => {}),
  };

  // Channel-aware inline style. Phase 26 channel vars (tone/color/colorTo/gradient)
  // land here as conditional spreads, last-write-wins means `color` overrides `tone`
  // when both are set (D-08). The .glasshome-widget CSS rule in tokens.css consumes
  // these vars to render the shell gradient + inset highlight.
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

  // Solid's `on:event` directive binds the handler once at element creation —
  // it does NOT react to accessor changes. So we register stable closures that
  // re-read `props.gestures` and `props.isEditMode` at dispatch time. Edit mode
  // suppresses gesture forwarding so the user can drag/select widgets.
  const gestureEnabled = () => !!props.gestures && !props.isEditMode;
  const onPointerEnter = (e: PointerEvent) => {
    if (gestureEnabled()) props.gestures?.onPointerEnter(e);
  };
  const onPointerDown = (e: PointerEvent) => {
    if (gestureEnabled()) props.gestures?.onPointerDown(e);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (gestureEnabled()) props.gestures?.onPointerMove(e);
  };
  const onPointerUp = (e: PointerEvent) => {
    if (gestureEnabled()) props.gestures?.onPointerUp(e);
  };
  const onPointerCancel = (e: PointerEvent) => {
    if (gestureEnabled()) props.gestures?.onPointerCancel(e);
  };

  return (
    <WidgetCtx.Provider value={contextValue}>
      <div
        ref={(el) => {
          containerRef = el;
          // Observe size unconditionally — cheap, needed for "auto" slide
          // orientation as soon as gestures re-enable after edit mode.
          props.gestures?.bindElement(el);
        }}
        class={cn(
          "glasshome-widget",
          "relative h-full w-full select-none overflow-hidden rounded-xl border border-border/50",
          // Variant styles (lowest priority)
          variantConfig()?.styles?.class,
          // Custom class (highest priority)
          props.class,
        )}
        style={channelStyle()}
        on:pointerenter={onPointerEnter}
        on:pointerdown={onPointerDown}
        on:pointermove={onPointerMove}
        on:pointerup={onPointerUp}
        on:pointercancel={onPointerCancel}
      >
        {/* Content, channel renders shell gradient + inset highlight via tokens.css */}
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

        {/* Loading overlay, color-mix tint via .glasshome-widget-loading rule in tokens.css */}
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

/**
 * Inline empty state component used by Widget when emptyState prop is provided.
 * Avoids circular dependency with WidgetEmptyState component.
 */
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

// ============================================================================
// Slot Components (attached to Widget)
// ============================================================================

import { WidgetSliderFill } from "../backgrounds/WidgetSliderFill";
import { WidgetContent } from "../components/WidgetContent";
import { WidgetIcon } from "../components/WidgetIcon";
import { WidgetStatus } from "../components/WidgetStatus";
import { WidgetTitle } from "../components/WidgetTitle";
import { WidgetValue } from "../components/WidgetValue";

// Create Widget with slot components attached
export const Widget = WidgetBase as unknown as WidgetComponent;

// Attach slot components to Widget
Widget.Content = WidgetContent;
Widget.Icon = WidgetIcon;
Widget.Title = WidgetTitle;
Widget.Status = WidgetStatus;
Widget.Value = WidgetValue;

// Attach background components to Widget
Widget.SliderFill = WidgetSliderFill;
