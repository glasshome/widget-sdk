/**
 * WidgetIcon Component
 *
 * Channel-driven icon. Background and glow read from `--widget-icon-color`
 * (with fallback to `--widget-color`) and `--widget-glow-strength` via the
 * `.glasshome-widget-icon` CSS rule in tokens.css. The `color` prop is the
 * optional per-icon override, pass any CSS color string (oklch, rgb, hex,
 * hsl, var(...)).
 *
 * @example Default, inherits the parent Widget's channel color
 * ```tsx
 * <Widget tone="info">
 *   <Widget.Icon icon={<Power />} />
 * </Widget>
 * ```
 *
 * @example Per-icon override (e.g. light bulb showing its actual rgb_color)
 * ```tsx
 * <Widget.Icon icon={<Lightbulb />} color="oklch(0.85 0.2 60)" />
 * ```
 */

import type { JSX } from "solid-js";
import { spacing } from "../design-system/spacing";
import { useWidgetContext } from "../hooks/use-widget-context";
import { cn } from "../utils/cn";

export interface WidgetIconProps {
  /** Icon component (JSX.Element) */
  icon: JSX.Element;
  /**
   * Optional CSS color string (oklch, hsl, rgb, hex, var()).
   * Sets `--widget-icon-color` inline on the icon root, overriding the
   * channel base color for the icon only. When omitted the channel's
   * `--widget-color` flows through via the tokens.css rule.
   * BREAKING (Phase 26): previously accepted Tailwind class strings.
   */
  color?: string;
  /** Reduce opacity */
  dimmed?: boolean;
  /** Number of entities, creates stacked background effect (1 = single, 2+ = stacked backgrounds) */
  entityCount?: number;
  /** Additional CSS classes */
  class?: string;
}

/**
 * Widget icon component with auto-responsive sizing.
 * Background + glow rendered by the `.glasshome-widget-icon` CSS rule.
 */
export function WidgetIcon(props: WidgetIconProps): JSX.Element {
  const ctx = useWidgetContext();

  const containerStyle = (): JSX.CSSProperties => {
    const base: JSX.CSSProperties = {
      width: `${spacing.icon(ctx.size())}px`,
      height: `${spacing.icon(ctx.size())}px`,
      "border-radius": "var(--radius-sm, 12px)",
    };
    if (props.color) base["--widget-icon-color"] = props.color;
    return base;
  };

  const stackStyle = (offset: number, zIndex: number, opacity: number): JSX.CSSProperties => ({
    width: `${spacing.icon(ctx.size()) * 1.02}px`,
    height: `${spacing.icon(ctx.size()) * 1.02}px`,
    "border-radius": "var(--radius-sm, 12px)",
    bottom: `${-spacing.icon(ctx.size()) * offset}px`,
    right: `${-spacing.icon(ctx.size()) * (offset * 0.71)}px`,
    "z-index": zIndex,
    opacity,
  });

  return (
    <div
      class={cn(
        "glasshome-widget-icon",
        "relative flex shrink-0 items-center justify-center transition-all",
        "pointer-events-none",
        props.dimmed && "opacity-50",
        props.class,
      )}
      style={containerStyle()}
    >
      {/* Stacked background effect: multiple backgrounds for multiple entities (D-17) */}
      {(props.entityCount ?? 1) >= 2 && (
        <div
          class="glasshome-widget-icon absolute"
          style={stackStyle(0.14, -2, 0.45)}
        />
      )}
      {(props.entityCount ?? 1) >= 3 && (
        <div
          class="glasshome-widget-icon absolute"
          style={stackStyle(0.28, -3, 0.2)}
        />
      )}
      {/* Icon wrapper with font-size-based sizing (iconify-icon renders at 1em) */}
      <div
        style={{
          "font-size": `${spacing.iconSize(ctx.size())}px`,
        }}
        class="flex items-center justify-center text-foreground"
      >
        {props.icon}
      </div>
    </div>
  );
}
