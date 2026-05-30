import type { JSX } from "solid-js";
import { cn } from "../utils/cn";

interface WidgetContentProps {
  class?: string;
  children: JSX.Element;
}

export function WidgetContent(props: WidgetContentProps): JSX.Element {
  return (
    <div class={cn("glasshome-widget-content", props.class)}>
      {props.children}
    </div>
  );
}
