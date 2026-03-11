/**
 * WidgetTitle Component
 *
 * Title component with automatic typography scaling and optional badge.
 *
 * @example
 * ```tsx
 * <Widget.Title>{config.title}</Widget.Title>
 * ```
 *
 * @example With badge
 * ```tsx
 * <Widget.Title badge={3}>Living Room</Widget.Title>
 * ```
 */

import type { JSX } from "solid-js";
import { spacing } from "../design-system/spacing";
import { typography } from "../design-system/typography";
import { WIDGET_Z } from "../design-system/z-index";
import { useWidgetContext } from "../hooks/use-widget-context";
import { cn } from "../utils/cn";

export interface WidgetTitleProps {
  /** Optional badge count */
  badge?: number;
  /** Additional CSS classes */
  class?: string;
  /** Title text */
  children: JSX.Element;
}

/**
 * Widget title component with auto-responsive typography
 * Positioned above other content with proper z-index
 */
export function WidgetTitle(props: WidgetTitleProps): JSX.Element {
  const ctx = useWidgetContext();

  return (
    <div
      class={cn("relative flex items-center", props.class)}
      style={{ gap: spacing.S1(ctx.size()), "z-index": WIDGET_Z.ACTIONS }}
    >
      <h3 class={cn("truncate text-white/60", typography.title(ctx.size()))}>{props.children}</h3>

      {props.badge !== undefined && props.badge > 0 && (
        <span
          class={cn(
            "shrink-0 rounded-full bg-white/20 px-2 py-0.5 font-medium text-white",
            typography.badge(ctx.size()),
          )}
        >
          {props.badge}
        </span>
      )}
    </div>
  );
}
