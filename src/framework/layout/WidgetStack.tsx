/**
 * WidgetStack Component
 *
 * Vertical flex layout with automatic responsive spacing.
 *
 * @example
 * ```tsx
 * <WidgetStack spacing="S2">
 *   <Widget.Icon icon={<Power />} />
 *   <Widget.Title>{title}</Widget.Title>
 *   <Widget.Status>{status}</Widget.Status>
 * </WidgetStack>
 * ```
 */

import type { JSX } from "solid-js";
import { spacing } from "../design-system/spacing";
import { useWidgetContext } from "../hooks/use-widget-context";
import type { SpacingScale } from "../types";
import { cn } from "../utils/cn";

export interface WidgetStackProps {
  /** Spacing between items (default: "S2") */
  spacing?: SpacingScale;
  /** Additional CSS classes */
  class?: string;
  /** Child elements */
  children: JSX.Element;
}

/**
 * Vertical stack layout with responsive spacing
 */
export function WidgetStack(props: WidgetStackProps): JSX.Element {
  const ctx = useWidgetContext();

  const gap = () => {
    const scale = props.spacing ?? "S2";
    return spacing[scale](ctx.size());
  };

  return (
    <div class={cn("flex flex-col", props.class)} style={{ gap: gap() }}>
      {props.children}
    </div>
  );
}
