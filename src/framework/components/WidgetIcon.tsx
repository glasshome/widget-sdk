/**
 * WidgetIcon Component
 *
 * Icon component with automatic sizing and glow effect.
 *
 * @example
 * ```tsx
 * <Widget.Icon
 *   icon={<Power />}
 *   color="bg-blue-500 dark:bg-blue-400"
 *   glow="shadow-blue-500/50 dark:shadow-blue-400/50"
 * />
 * ```
 */

import type { JSX } from "solid-js";
import { spacing } from "../design-system/spacing";
import { useWidgetContext } from "../hooks/use-widget-context";
import { cn } from "../utils/cn";

export interface WidgetIconProps {
  /** Icon component (JSX.Element) */
  icon: JSX.Element;
  /** Background color (Tailwind class like "bg-blue-500 dark:bg-blue-400") */
  color?: string;
  /** Glow/shadow effect (Tailwind shadow class like "shadow-blue-500/50") */
  glow?: string;
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

  return (
    <div
      class={cn(
        "relative flex shrink-0 items-center justify-center transition-all",
        "pointer-events-none",
        props.dimmed && "opacity-50",
        props.glow && "shadow-[0_0_25px]",
        props.color ?? "bg-white/10",
        props.glow,
        props.class,
      )}
      style={{
        width: `${spacing.icon(ctx.size())}px`,
        height: `${spacing.icon(ctx.size())}px`,
        "border-radius": spacing.iconRadius(ctx.size()),
      }}
    >
      {/* Stacked background effect: multiple backgrounds for multiple entities */}
      {(props.entityCount ?? 1) >= 2 && (
        <div
          class={cn("absolute", props.color ?? "bg-white/10")}
          style={{
            width: `${spacing.icon(ctx.size()) * 1.02}px`,
            height: `${spacing.icon(ctx.size()) * 1.02}px`,
            "border-radius": spacing.iconRadius(ctx.size()),
            bottom: `${-spacing.icon(ctx.size()) * 0.14}px`,
            right: `${-spacing.icon(ctx.size()) * 0.1}px`,
            "z-index": -2,
            opacity: 0.45,
          }}
        />
      )}
      {(props.entityCount ?? 1) >= 3 && (
        <div
          class={cn("absolute", props.color ?? "bg-white/10")}
          style={{
            width: `${spacing.icon(ctx.size()) * 1.02}px`,
            height: `${spacing.icon(ctx.size()) * 1.02}px`,
            "border-radius": spacing.iconRadius(ctx.size()),
            bottom: `${-spacing.icon(ctx.size()) * 0.28}px`,
            right: `${-spacing.icon(ctx.size()) * 0.2}px`,
            "z-index": -3,
            opacity: 0.2,
          }}
        />
      )}
      {/* Icon wrapper with CSS-based sizing */}
      <div
        style={{
          width: `${spacing.iconSize(ctx.size())}px`,
          height: `${spacing.iconSize(ctx.size())}px`,
        }}
        class="flex items-center justify-center text-white [&>*]:h-full [&>*]:w-full"
      >
        {props.icon}
      </div>
    </div>
  );
}
