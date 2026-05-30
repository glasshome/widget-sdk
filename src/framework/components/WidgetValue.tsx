import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { formatValue, interpretValue } from "../utils";
import { cn } from "../utils/cn";

interface WidgetValueProps {
  value: number | string;
  unit?: string;
  /** Show semantic interpretation (e.g. "Warm" for 22°C) */
  interpret?: boolean;
  class?: string;
}

export function WidgetValue(props: WidgetValueProps): JSX.Element {
  return (
    <div class={cn("flex flex-col", props.class)}>
      <div class="glasshome-widget-value">
        {formatValue(props.value, props.unit)}
      </div>
      <Show when={props.interpret && typeof props.value === "number"}>
        <div class="glasshome-widget-subtitle">
          {interpretValue(props.value as number, props.unit)}
        </div>
      </Show>
    </div>
  );
}
