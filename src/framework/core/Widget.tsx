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
 * @example With gradient and loading
 * ```tsx
 * <Widget gradient="bg-gradient-to-br from-blue-500/40 to-blue-700/40" loading={isLoading}>
 *   {children}
 * </Widget>
 * ```
 */

import { createElementSize } from "@solid-primitives/resize-observer";
import { createEffect, createMemo, createSignal, type JSX, untrack, useContext } from "solid-js";
import type { WidgetSliderFill as WidgetSliderFillType } from "../backgrounds/WidgetSliderFill";
// Import slot component types for compound interface
import type { WidgetContent as WidgetContentType } from "../components/WidgetContent";
import type { WidgetEmptyState as WidgetEmptyStateType } from "../components/WidgetEmptyState";
import type { WidgetIcon as WidgetIconType } from "../components/WidgetIcon";
import type { WidgetMetrics as WidgetMetricsType } from "../components/WidgetMetrics";
import type { WidgetStatus as WidgetStatusType } from "../components/WidgetStatus";
import type { WidgetSubtitle as WidgetSubtitleType } from "../components/WidgetSubtitle";
import type { WidgetTitle as WidgetTitleType } from "../components/WidgetTitle";
import type { WidgetValue as WidgetValueType } from "../components/WidgetValue";
import { WIDGET_Z } from "../design-system/z-index";
import { type BridgeableWidgetContext, type ReactiveWidgetContext, WidgetCtx } from "../hooks/use-widget-context";
import type {
  WidgetDimensions,
  WidgetOrientation,
  WidgetSize,
  WidgetVariantConfig,
} from "../types";
import { cn } from "../utils/cn";
import { getBuiltInVariant } from "../variants";

export interface WidgetEmptyStateConfig {
  /** Icon to display */
  icon?: JSX.Element;
  /** Main title/heading */
  title?: string;
  /** Descriptive message */
  message?: string;
}

export interface WidgetProps {
  /** Widget variant (string ID or inline config) */
  variant?: string | WidgetVariantConfig;
  /** Gradient background (Tailwind classes like "bg-gradient-to-br from-cyan-600/40 to-blue-700/40") */
  gradient?: string;
  /** Show loading overlay */
  loading?: boolean;
  /** Background glow color (Tailwind color like "bg-blue-500") (runtime override) */
  backgroundGlow?: string;
  /** Additional CSS classes */
  class?: string;
  /** Is edit mode (disables gestures) */
  isEditMode?: boolean;
  /** Called when delete button is clicked (only shown in edit mode) */
  onDelete?: () => void;
  /** Empty state configuration - when provided, shows empty state and applies gray gradient */
  emptyState?: WidgetEmptyStateConfig;
  /** Child elements */
  children?: JSX.Element;
}

// Extend Widget interface with slot components
export interface WidgetComponent {
  (props: WidgetProps): JSX.Element;
  Content: typeof WidgetContentType;
  Icon: typeof WidgetIconType;
  Title: typeof WidgetTitleType;
  Subtitle: typeof WidgetSubtitleType;
  Status: typeof WidgetStatusType;
  Value: typeof WidgetValueType;
  Metrics: typeof WidgetMetricsType;
  EmptyState: typeof WidgetEmptyStateType;
  SliderFill: typeof WidgetSliderFillType;
}

/**
 * Classify widget size based on grid dimensions
 */
export function classifySize(gridWidth: number, gridHeight: number): WidgetSize {
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
export function detectOrientation(width: number, height: number): WidgetOrientation {
  if (width > height) return "horizontal";
  if (height > width) return "vertical";
  return "square";
}

/**
 * Detect content layout direction
 * Used for UI arrangement (stack vertically vs horizontally)
 * Considers height threshold - tall widgets benefit from vertical stacking
 */
export function detectContentLayout(width: number, height: number): WidgetOrientation {
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

  // Auto-apply empty state gradient if emptyState prop is provided and no gradient is explicitly provided
  const emptyStateGradient = "bg-gradient-to-br from-gray-500/20 to-gray-600/20";
  const finalGradient = createMemo(() =>
    props.emptyState && !props.gradient ? emptyStateGradient : props.gradient,
  );

  // Merge variant styles with props
  const mergedStyles = createMemo(
    (): JSX.CSSProperties => ({
      "container-type": "size",
      "container-name": "widget",
      ...variantConfig()?.styles?.container,
      ...(variantConfig()?.styles?.cssVars || {}),
    }),
  );

  return (
    <WidgetCtx.Provider value={contextValue}>
      <div
        ref={containerRef}
        class={cn(
          "relative h-full w-full select-none rounded-xl border border-border/50",
          // Variant styles (lowest priority)
          variantConfig()?.styles?.class,
          // Custom class (highest priority)
          props.class,
        )}
        style={mergedStyles()}
      >
        {/* Inner container with gradient and overflow */}
        <div
          class={cn(
            "relative h-full w-full overflow-hidden rounded-xl",
            // Gradient prop (overrides variant, auto-applied for empty state)
            finalGradient(),
          )}
        >
          {/* Background glow effect */}
          {props.backgroundGlow && (
            <div
              class="pointer-events-none absolute inset-0"
              style={{ "z-index": WIDGET_Z.BACKGROUND }}
            >
              <div class={cn("absolute inset-0 opacity-20 blur-2xl", props.backgroundGlow)} />
            </div>
          )}

          {/* Content - flexible layout controlled by widget author */}
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

          {/* Loading overlay */}
          {props.loading && (
            <div
              class="pointer-events-none absolute inset-0 animate-pulse bg-blue-500/20"
              style={{ "z-index": WIDGET_Z.OVERLAY }}
            />
          )}
        </div>
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
import { WidgetEmptyState } from "../components/WidgetEmptyState";
import { WidgetIcon } from "../components/WidgetIcon";
import { WidgetMetrics } from "../components/WidgetMetrics";
import { WidgetStatus } from "../components/WidgetStatus";
import { WidgetSubtitle } from "../components/WidgetSubtitle";
import { WidgetTitle } from "../components/WidgetTitle";
import { WidgetValue } from "../components/WidgetValue";

// Create Widget with slot components attached
export const Widget = WidgetBase as unknown as WidgetComponent;

// Attach slot components to Widget
Widget.Content = WidgetContent;
Widget.Icon = WidgetIcon;
Widget.Title = WidgetTitle;
Widget.Subtitle = WidgetSubtitle;
Widget.Status = WidgetStatus;
Widget.Value = WidgetValue;
Widget.Metrics = WidgetMetrics;
Widget.EmptyState = WidgetEmptyState;

// Attach background components to Widget
Widget.SliderFill = WidgetSliderFill;
