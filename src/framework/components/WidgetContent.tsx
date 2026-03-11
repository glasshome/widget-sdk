/**
 * WidgetContent Component
 *
 * Standard content container for widgets with consistent padding, gap, and layout direction.
 *
 * Uses contentLayout (not orientation) for UI arrangement:
 * - Tall widgets (150px+) -> vertical layout (stacked)
 * - Other widgets -> follows aspect ratio
 *
 * @example
 * ```tsx
 * <Widget.Content>
 *   <Widget.Icon icon={<Power />} />
 *   <Widget.Title>Living Room</Widget.Title>
 * </Widget.Content>
 * ```
 */

import type { JSX } from "solid-js";
import { getSpacingClass, spacing } from "../design-system/spacing";
import { WIDGET_Z } from "../design-system/z-index";
import { useWidgetContext } from "../hooks/use-widget-context";
import { cn } from "../utils/cn";

export interface WidgetContentProps {
  /** Additional CSS classes */
  class?: string;
  /** Content children */
  children: JSX.Element;
}

/**
 * Widget content container with auto-responsive layout
 * Ensures proper z-index layering for title, status, and controls
 */
export function WidgetContent(props: WidgetContentProps): JSX.Element {
  const ctx = useWidgetContext();

  return (
    <div
      class={cn(
        "relative flex h-full w-full overflow-hidden",
        // Ensure controls (ml-auto divs) are above other content
        "[&_div.ml-auto]:relative [&_div.ml-auto]:z-30",
        ctx.contentLayout() === "horizontal" ? "flex-row items-center" : "flex-col justify-between",
        getSpacingClass("S3", ctx.size()),
        props.class,
      )}
      style={{
        padding: spacing.container(ctx.size()),
        "z-index": WIDGET_Z.CONTENT,
      }}
    >
      {props.children}
    </div>
  );
}
