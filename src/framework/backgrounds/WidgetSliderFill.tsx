import type { JSX } from "solid-js";
import { WIDGET_Z } from "../design-system/z-index";
import { cn } from "../utils/cn";

interface WidgetSliderFillProps {
  /** Current value (0-100) */
  value: number;
  /** Per-fill channel override; sets --widget-icon-color inline. */
  color?: string;
  /** Disables the fill transition while the user is dragging. */
  isDragging?: boolean;
  class?: string;
}

export function WidgetSliderFill(props: WidgetSliderFillProps): JSX.Element {
  return (
    <div
      class={cn(
        "glasshome-widget-slider-fill pointer-events-none absolute inset-0",
        props.isDragging ? "duration-0" : "transition-all duration-300 ease-out",
        props.class,
      )}
      style={{
        ...({
          "--widget-fill-value": props.value,
          "z-index": WIDGET_Z.BACKGROUND,
        } as JSX.CSSProperties),
        ...(props.color
          ? ({ "--widget-icon-color": props.color } as JSX.CSSProperties)
          : {}),
      }}
    />
  );
}
