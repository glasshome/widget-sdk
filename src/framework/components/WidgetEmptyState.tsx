/**
 * WidgetEmptyState Component
 *
 * Placeholder component for widgets with no data or content.
 * Shows a centered message with optional icon and action.
 *
 * @example
 * ```tsx
 * <Widget.EmptyState
 *   icon={<AlertCircle />}
 *   title="No devices found"
 *   message="Add devices to see them here"
 *   action={<Button>Add Device</Button>}
 * />
 * ```
 */

import type { JSX } from "solid-js";
import { spacing } from "../design-system/spacing";
import { typography } from "../design-system/typography";
import { useWidgetContext } from "../hooks/use-widget-context";
import { cn } from "../utils/cn";

export interface WidgetEmptyStateProps {
  /** Icon to display (optional) */
  icon?: JSX.Element;
  /** Main title/heading */
  title?: string;
  /** Descriptive message */
  message?: string;
  /** Optional action button */
  action?: JSX.Element;
  /** Additional CSS classes */
  class?: string;
}

/**
 * Widget empty state component
 * Shows centered placeholder when widget has no content
 */
export function WidgetEmptyState(props: WidgetEmptyStateProps): JSX.Element {
  const ctx = useWidgetContext();

  const isHorizontal = () => ctx.contentLayout() === "horizontal";

  return (
    <div
      class={cn(
        "flex h-full w-full",
        isHorizontal()
          ? "flex-row items-center justify-start"
          : "flex-col items-center justify-center text-center",
        props.class,
      )}
      style={{ gap: spacing.S2(ctx.size()), padding: spacing.container(ctx.size()) }}
    >
      {/* Icon */}
      {props.icon && (
        <div
          class={cn(
            "flex items-center justify-center text-white/30",
            isHorizontal() ? "shrink-0" : "",
          )}
          style={{
            width: `${spacing.icon(ctx.size())}px`,
            height: `${spacing.icon(ctx.size())}px`,
          }}
        >
          {props.icon}
        </div>
      )}

      {/* Text content */}
      <div
        class={cn(
          "flex flex-col",
          isHorizontal() ? "items-start text-left" : "items-center text-center",
        )}
        style={{ gap: spacing.S1(ctx.size()) }}
      >
        {/* Title */}
        {(props.title ?? "No data") && (
          <h3
            class={cn("font-semibold text-white/60", typography.subtitle(ctx.size()))}
            style={{ "max-width": isHorizontal() ? "100%" : "80%" }}
          >
            {props.title ?? "No data"}
          </h3>
        )}

        {/* Message */}
        {props.message && (
          <p
            class={cn("text-white/50", typography.emptyState(ctx.size()))}
            style={{ "max-width": isHorizontal() ? "100%" : "85%" }}
          >
            {props.message}
          </p>
        )}

        {/* Action */}
        {props.action && <div class="mt-2">{props.action}</div>}
      </div>
    </div>
  );
}
