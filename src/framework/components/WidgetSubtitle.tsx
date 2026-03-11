/**
 * WidgetSubtitle Component
 *
 * Secondary text component below the title with automatic typography scaling.
 *
 * @example
 * ```tsx
 * <Widget.Subtitle>Living Room</Widget.Subtitle>
 * ```
 *
 * @example With dimmed style
 * ```tsx
 * <Widget.Subtitle dimmed>2 devices offline</Widget.Subtitle>
 * ```
 */

import type { JSX } from "solid-js";
import { typography } from "../design-system/typography";
import { useWidgetContext } from "../hooks/use-widget-context";
import { cn } from "../utils/cn";

export interface WidgetSubtitleProps {
  /** Whether to dim the subtitle */
  dimmed?: boolean;
  /** Additional CSS classes */
  class?: string;
  /** Subtitle text */
  children: JSX.Element;
}

/**
 * Widget subtitle component with auto-responsive typography
 */
export function WidgetSubtitle(props: WidgetSubtitleProps): JSX.Element {
  const ctx = useWidgetContext();

  return (
    <p
      class={cn(
        "truncate font-medium text-white/80",
        props.dimmed && "text-white/50",
        typography.subtitle(ctx.size()),
        props.class,
      )}
    >
      {props.children}
    </p>
  );
}
