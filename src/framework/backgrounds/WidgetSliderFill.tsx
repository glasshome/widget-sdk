/**
 * WidgetSliderFill Component
 *
 * Animated fill overlay that follows a slider value. Background and glow are
 * rendered by the `.glasshome-widget-slider-fill` CSS rule in tokens.css via
 * the channel vars (`--widget-icon-color` with fallback to `--widget-color`).
 * The `color` prop is the optional per-fill override: when provided it is
 * written inline as `--widget-icon-color`, mirroring `Widget.Icon.color`
 * (Phase 26 VIS-A05). Orientation is inherited from the parent Widget context
 * and drives the `clip-path` direction.
 *
 * @example Default, inherits parent Widget channel color
 * ```tsx
 * <Widget tone="info" gestures={{ slide: { value, onChange } }}>
 *   <Widget.SliderFill value={position} />
 *   <Widget.Content>...</Widget.Content>
 * </Widget>
 * ```
 *
 * @example Per-fill override (sets --widget-icon-color, not background directly)
 * ```tsx
 * <Widget.SliderFill value={brightness} color={bulbColor} />
 * ```
 */

import type { JSX } from "solid-js";
import { WIDGET_Z } from "../design-system/z-index";
import { useWidgetContext } from "../hooks/use-widget-context";
import { cn } from "../utils/cn";

interface WidgetSliderFillProps {
  /** Current value (0-100) */
  value: number;
  /**
   * Optional channel override: sets `--widget-icon-color` inline on the fill
   * root. When omitted the fill renders in the parent Widget's channel color
   * (var(--widget-color)). Mirrors Widget.Icon.color (Phase 26 VIS-A05).
   */
  color?: string;
  /** Whether the slider is currently being dragged (disables transition) */
  isDragging?: boolean;
  /** Additional CSS classes */
  class?: string;
}

/**
 * Animated slider fill that adapts to widget orientation.
 */
export function WidgetSliderFill(props: WidgetSliderFillProps): JSX.Element {
  const ctx = useWidgetContext();

  // Vertical: fill from bottom to top. Horizontal: fill from left to right.
  const clipPath = () =>
    ctx.orientation() === "vertical"
      ? `inset(${100 - props.value}% 0 0 0)`
      : `inset(0 ${100 - props.value}% 0 0)`;

  const containerStyle = (): JSX.CSSProperties => {
    const base: JSX.CSSProperties = {
      "clip-path": clipPath(),
      "z-index": WIDGET_Z.BACKGROUND,
    };
    if (props.color) base["--widget-icon-color"] = props.color;
    return base;
  };

  return (
    <div
      class={cn(
        "glasshome-widget-slider-fill pointer-events-none absolute inset-0",
        props.isDragging ? "duration-0" : "transition-all duration-300 ease-out",
        props.class,
      )}
      style={containerStyle()}
    />
  );
}
