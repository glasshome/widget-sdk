/**
 * WidgetValue Component
 *
 * Numeric value display with optional unit and semantic interpretation.
 *
 * @example
 * ```tsx
 * <Widget.Value value={22} unit="C" />
 * ```
 *
 * @example With interpretation
 * ```tsx
 * <Widget.Value value={22} unit="C" interpret />
 * // Displays: "22C Warm"
 * ```
 */

import type { JSX } from "solid-js";
import { spacing } from "../design-system/spacing";
import { typography } from "../design-system/typography";
import { useWidgetContext } from "../hooks/use-widget-context";
import { formatValue, interpretValue } from "../utils";
import { cn } from "../utils/cn";

export interface WidgetValueProps {
  /** The value to display */
  value: number | string;
  /** Unit of measurement */
  unit?: string;
  /** Show semantic interpretation */
  interpret?: boolean;
  /** Additional CSS classes */
  class?: string;
}

/**
 * Widget value component with auto-formatting and interpretation
 */
export function WidgetValue(props: WidgetValueProps): JSX.Element {
  const ctx = useWidgetContext();

  return (
    <div class={cn("flex flex-col", props.class)}>
      <div class={cn("font-bold text-white", typography.value(ctx.size()))}>
        {formatValue(props.value, props.unit)}
      </div>

      {props.interpret && typeof props.value === "number" && (
        <div
          class={cn("text-white/60", typography.subtitle(ctx.size()))}
          style={{ "margin-top": spacing.S1(ctx.size()) }}
        >
          {interpretValue(props.value, props.unit)}
        </div>
      )}
    </div>
  );
}
