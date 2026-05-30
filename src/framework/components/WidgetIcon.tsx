import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { cn } from "../utils/cn";

interface WidgetIconProps {
  icon: JSX.Element;
  /** Per-icon channel override; sets --widget-icon-color inline. */
  color?: string;
  dimmed?: boolean;
  /** Number of entities, creates stacked background effect (1 = single, 2+ = stacked backgrounds) */
  entityCount?: number;
  class?: string;
}

export function WidgetIcon(props: WidgetIconProps): JSX.Element {
  const count = () => props.entityCount ?? 1;
  return (
    <div
      class={cn(
        "glasshome-widget-icon",
        "relative flex shrink-0 items-center justify-center pointer-events-none transition-all",
        props.dimmed && "opacity-50",
        props.class,
      )}
      style={props.color ? ({ "--widget-icon-color": props.color } as JSX.CSSProperties) : undefined}
    >
      <Show when={count() >= 2}>
        <div class="glasshome-widget-icon glasshome-widget-icon-stack glasshome-widget-icon-stack-2" />
      </Show>
      <Show when={count() >= 3}>
        <div class="glasshome-widget-icon glasshome-widget-icon-stack glasshome-widget-icon-stack-3" />
      </Show>
      <div class="glasshome-widget-icon-glyph flex items-center justify-center">
        {props.icon}
      </div>
    </div>
  );
}
