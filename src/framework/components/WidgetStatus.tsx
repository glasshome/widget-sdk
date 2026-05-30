import type { JSX } from "solid-js";
import { WIDGET_Z } from "../design-system/z-index";
import { cn } from "../utils/cn";

interface WidgetStatusProps {
  dimmed?: boolean;
  class?: string;
  isUnavailable?: boolean;
  children: JSX.Element;
}

export function WidgetStatus(props: WidgetStatusProps): JSX.Element {
  return (
    <p
      class={cn(
        "glasshome-widget-status",
        "relative",
        props.dimmed && "opacity-40",
        props.class,
      )}
      style={{ "z-index": WIDGET_Z.ACTIONS }}
    >
      {props.isUnavailable ? "Unavailable" : props.children}
    </p>
  );
}
