import type { JSX } from "solid-js";
import { WIDGET_Z } from "../design-system/z-index";
import { sdkI18n } from "../i18n/sdk-text";
import { cn } from "../utils/cn";

interface WidgetStatusProps {
  dimmed?: boolean;
  class?: string;
  isUnavailable?: boolean;
  children: JSX.Element;
}

export function WidgetStatus(props: WidgetStatusProps): JSX.Element {
  const { text } = sdkI18n();
  return (
    <p
      class={cn("glasshome-widget-status", "relative", props.dimmed && "opacity-40", props.class)}
      style={{ "z-index": WIDGET_Z.ACTIONS }}
    >
      {props.isUnavailable ? text("sdk.state.unavailable") : props.children}
    </p>
  );
}
