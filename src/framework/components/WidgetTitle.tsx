import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { WIDGET_Z } from "../design-system/z-index";
import { cn } from "../utils/cn";

interface WidgetTitleProps {
  badge?: number;
  class?: string;
  children: JSX.Element;
}

export function WidgetTitle(props: WidgetTitleProps): JSX.Element {
  return (
    <div
      class={cn("relative flex items-center gap-2", props.class)}
      style={{ "z-index": WIDGET_Z.ACTIONS }}
    >
      <h3 class="glasshome-widget-title">{props.children}</h3>
      <Show when={props.badge !== undefined && props.badge > 0}>
        <span class="glasshome-widget-badge shrink-0">{props.badge}</span>
      </Show>
    </div>
  );
}
