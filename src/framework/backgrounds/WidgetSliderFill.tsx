/**
 * WidgetSliderFill Component
 *
 * Animated fill overlay that follows a slider value.
 * Automatically adapts direction based on widget orientation.
 *
 * @example
 * ```tsx
 * <Widget gestures={{ slide: { value, onChange } }}>
 *   <Widget.SliderFill value={brightness} color="rgb(255, 200, 0)" />
 *   <Widget.Content>...</Widget.Content>
 * </Widget>
 * ```
 */

import type { JSX } from "solid-js";
import { WIDGET_Z } from "../design-system/z-index";
import { useWidgetContext } from "../hooks/use-widget-context";
import { cn } from "../utils/cn";

export interface WidgetSliderFillProps {
  /** Current value (0-100) */
  value: number;
  /** Fill color (CSS color string) */
  color?: string;
  /** Show glow effect */
  glow?: boolean;
  /** Opacity of the fill (0-1) */
  opacity?: number;
  /** Whether slider is currently being dragged (disables transition) */
  isDragging?: boolean;
  /** Additional CSS classes */
  class?: string;
}

/**
 * Animated slider fill that adapts to widget orientation
 */
export function WidgetSliderFill(props: WidgetSliderFillProps): JSX.Element {
  const ctx = useWidgetContext();

  // Calculate clipPath based on orientation
  // Vertical: fill from bottom to top
  // Horizontal: fill from left to right
  const clipPath = () =>
    ctx.orientation() === "vertical"
      ? `inset(${100 - props.value}% 0 0 0)`
      : `inset(0 ${100 - props.value}% 0 0)`;

  const fillColor = () => props.color ?? "rgb(59, 130, 246)";

  return (
    <>
      {/* Glow effect (optional) */}
      {(props.glow ?? false) && props.value > 0 && (
        <div
          class="pointer-events-none absolute inset-0 opacity-40 blur-2xl"
          style={{
            background: fillColor(),
            "z-index": WIDGET_Z.BACKGROUND,
          }}
        />
      )}

      {/* Animated fill */}
      <div
        class={cn(
          "pointer-events-none absolute inset-0",
          props.isDragging ? "duration-0" : "transition-all duration-300 ease-out",
          props.class,
        )}
        style={{
          background: fillColor(),
          "clip-path": clipPath(),
          opacity: props.opacity ?? 0.3,
          "z-index": WIDGET_Z.BACKGROUND,
        }}
      />
    </>
  );
}
