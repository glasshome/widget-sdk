/**
 * WidgetStatus Component
 *
 * Status text component with auto-responsive typography.
 *
 * @example
 * ```tsx
 * <Widget.Status>{entity.state}</Widget.Status>
 * ```
 */

import type { JSX } from "solid-js";
import { typography } from "../design-system/typography";
import { WIDGET_Z } from "../design-system/z-index";
import { useWidgetContext } from "../hooks/use-widget-context";
import { cn } from "../utils/cn";

export interface WidgetStatusProps {
  /** Reduce opacity further */
  dimmed?: boolean;
  /** Additional CSS classes */
  class?: string;
  /** Show "Unavailable" text instead of children */
  isUnavailable?: boolean;
  /** Status text */
  children: JSX.Element;
}

/**
 * Widget status component with auto-responsive typography
 * Positioned above other content with proper z-index
 */
export function WidgetStatus(props: WidgetStatusProps): JSX.Element {
  const ctx = useWidgetContext();

  return (
    <p
      class={cn(
        "relative font-bold text-white",
        props.dimmed && "opacity-40",
        typography.status(ctx.size()),
        props.class,
      )}
      style={{ "z-index": WIDGET_Z.ACTIONS }}
    >
      {props.isUnavailable ? "Unavailable" : props.children}
    </p>
  );
}
