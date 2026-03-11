/**
 * WidgetMetrics Component
 *
 * Small data displays for showing multiple stats/values.
 * Automatically arranges metrics based on widget size.
 *
 * @example
 * ```tsx
 * <Widget.Metrics>
 *   <Widget.Metrics.Item label="Temp" value="72F" />
 *   <Widget.Metrics.Item label="Humidity" value="45%" />
 *   <Widget.Metrics.Item label="Battery" value="87%" />
 * </Widget.Metrics>
 * ```
 */

import type { JSX } from "solid-js";
import { spacing } from "../design-system/spacing";
import { typography } from "../design-system/typography";
import { useWidgetContext } from "../hooks/use-widget-context";
import { cn } from "../utils/cn";

export interface WidgetMetricsProps {
  /** Layout direction (default: "auto" - horizontal for horizontal widgets, vertical for others) */
  direction?: "horizontal" | "vertical" | "auto";
  /** Additional CSS classes */
  class?: string;
  /** Metric items */
  children: JSX.Element;
}

// Compound component interface
export interface WidgetMetricsComponent {
  (props: WidgetMetricsProps): JSX.Element;
  Item: typeof WidgetMetricsItem;
}

/**
 * Widget metrics container
 * Displays multiple small data points
 */
function WidgetMetricsBase(props: WidgetMetricsProps): JSX.Element {
  const ctx = useWidgetContext();

  // Auto-detect layout based on widget orientation
  const finalDirection = () => {
    const dir = props.direction ?? "auto";
    return dir === "auto" ? (ctx.orientation() === "horizontal" ? "horizontal" : "vertical") : dir;
  };

  return (
    <div
      class={cn(
        "flex",
        finalDirection() === "horizontal" ? "flex-row gap-4" : "flex-col gap-2",
        props.class,
      )}
    >
      {props.children}
    </div>
  );
}

// ============================================================================
// WidgetMetrics.Item
// ============================================================================

export interface WidgetMetricsItemProps {
  /** Metric label */
  label: string;
  /** Metric value */
  value: string | number;
  /** Optional unit */
  unit?: string;
  /** Optional icon */
  icon?: JSX.Element;
  /** Whether to dim the metric */
  dimmed?: boolean;
  /** Additional CSS classes */
  class?: string;
}

/**
 * Individual metric item
 */
export function WidgetMetricsItem(props: WidgetMetricsItemProps): JSX.Element {
  const ctx = useWidgetContext();

  return (
    <div
      class={cn("flex flex-col", props.dimmed && "opacity-50", props.class)}
      style={{ gap: spacing.S1(ctx.size()) }}
    >
      <div class={cn("flex items-center gap-1 text-white/60", typography.metricLabel(ctx.size()))}>
        {props.icon && <span class="shrink-0">{props.icon}</span>}
        <span>{props.label}</span>
      </div>
      <div class={cn("font-semibold text-white", typography.metricValue(ctx.size()))}>
        {props.value}
        {props.unit && <span class="ml-1 text-white/70">{props.unit}</span>}
      </div>
    </div>
  );
}

// Create compound component
export const WidgetMetrics = WidgetMetricsBase as unknown as WidgetMetricsComponent;

// Attach Item to Metrics
WidgetMetrics.Item = WidgetMetricsItem;
