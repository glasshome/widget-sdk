/**
 * WidgetIcon Component
 *
 * Icon component with automatic sizing and glow effect.
 * Supports both Tailwind classes and dynamic CSS colors for background/glow.
 *
 * @example Static color (Tailwind classes)
 * ```tsx
 * <Widget.Icon
 *   icon={<Power />}
 *   color="bg-blue-500 dark:bg-blue-400"
 *   glow="shadow-blue-500/50 dark:shadow-blue-400/50"
 * />
 * ```
 *
 * @example Dynamic color (CSS color string — adaptive contrast)
 * ```tsx
 * <Widget.Icon
 *   icon={<Lightbulb />}
 *   dynamicColor="hsl(320, 100%, 50%)"
 * />
 * ```
 */

import type { JSX } from "solid-js";
import { spacing } from "../design-system/spacing";
import { useWidgetContext } from "../hooks/use-widget-context";
import { deriveAdaptiveIconColors } from "../theming/adaptive-color";
import { cn } from "../utils/cn";

export interface WidgetIconProps {
  /** Icon component (JSX.Element) */
  icon: JSX.Element;
  /** Background color as Tailwind class (e.g. "bg-blue-500 dark:bg-blue-400") */
  color?: string;
  /** Glow/shadow effect as Tailwind class (e.g. "shadow-blue-500/50") */
  glow?: string;
  /**
   * Dynamic CSS color string (rgb, hsl, hex).
   * When provided, icon background and glow are derived adaptively from this color.
   * Takes precedence over `color` and `glow` props.
   */
  dynamicColor?: string;
  /** Reduce opacity */
  dimmed?: boolean;
  /** Number of entities - creates stacked background effect (1 = single, 2+ = stacked backgrounds) */
  entityCount?: number;
  /** Additional CSS classes */
  class?: string;
}

/**
 * Widget icon component with auto-responsive sizing
 */
export function WidgetIcon(props: WidgetIconProps): JSX.Element {
  const ctx = useWidgetContext();

  const adaptive = () => (props.dynamicColor ? deriveAdaptiveIconColors(props.dynamicColor) : null);
  const useDynamic = () => !!adaptive();

  const bgStyle = (): JSX.CSSProperties | undefined => {
    const a = adaptive();
    if (!a) return undefined;
    return { "background-color": a.background };
  };

  const glowStyle = (): JSX.CSSProperties | undefined => {
    const a = adaptive();
    if (!a) return undefined;
    return { "box-shadow": `0 0 25px ${a.glow}` };
  };

  const containerStyle = (): JSX.CSSProperties => {
    const base: JSX.CSSProperties = {
      width: `${spacing.icon(ctx.size())}px`,
      height: `${spacing.icon(ctx.size())}px`,
      "border-radius": "var(--radius-sm, 12px)",
    };
    const bg = bgStyle();
    const gl = glowStyle();
    if (bg) Object.assign(base, bg);
    if (gl) Object.assign(base, gl);
    return base;
  };

  const stackStyle = (offset: number, zIndex: number, opacity: number): JSX.CSSProperties => {
    const base: JSX.CSSProperties = {
      width: `${spacing.icon(ctx.size()) * 1.02}px`,
      height: `${spacing.icon(ctx.size()) * 1.02}px`,
      "border-radius": "var(--radius-sm, 12px)",
      bottom: `${-spacing.icon(ctx.size()) * offset}px`,
      right: `${-spacing.icon(ctx.size()) * (offset * 0.71)}px`,
      "z-index": zIndex,
      opacity,
    };
    const bg = bgStyle();
    if (bg) Object.assign(base, bg);
    return base;
  };

  return (
    <div
      class={cn(
        "relative flex shrink-0 items-center justify-center transition-all",
        "pointer-events-none",
        props.dimmed && "opacity-50",
        // Only apply Tailwind classes when not using dynamic colors
        !useDynamic() && props.glow && "shadow-[0_0_25px]",
        !useDynamic() && (props.color ?? "bg-white/10"),
        !useDynamic() && props.glow,
        props.class,
      )}
      style={containerStyle()}
    >
      {/* Stacked background effect: multiple backgrounds for multiple entities */}
      {(props.entityCount ?? 1) >= 2 && (
        <div
          class={cn("absolute", !useDynamic() && (props.color ?? "bg-white/10"))}
          style={stackStyle(0.14, -2, 0.45)}
        />
      )}
      {(props.entityCount ?? 1) >= 3 && (
        <div
          class={cn("absolute", !useDynamic() && (props.color ?? "bg-white/10"))}
          style={stackStyle(0.28, -3, 0.2)}
        />
      )}
      {/* Icon wrapper with font-size-based sizing (iconify-icon renders at 1em) */}
      <div
        style={{
          "font-size": `${spacing.iconSize(ctx.size())}px`,
        }}
        class="flex items-center justify-center text-white"
      >
        {props.icon}
      </div>
    </div>
  );
}
