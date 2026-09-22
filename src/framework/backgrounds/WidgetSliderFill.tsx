import type { JSX } from "solid-js";
import { deprecate } from "../../deprecations";
import { WIDGET_Z } from "../design-system/z-index";
import { cn } from "../utils/cn";

interface WidgetSliderFillProps {
  /** Current value (0-100) */
  value: number;
  /** @deprecated Ignored: the fill wears the card's own tone. Removed in 2.0.0. */
  color?: string;
  /** Disables the fill transition while the user is dragging. */
  isDragging?: boolean;
  class?: string;
}

const warnColor = deprecate(() => undefined, "sliderFill.color");

export function WidgetSliderFill(props: WidgetSliderFillProps): JSX.Element {
  if (props.color !== undefined) warnColor();
  return (
    <div
      class={cn(
        "glasshome-widget-slider-fill pointer-events-none absolute inset-0",
        props.isDragging ? "duration-0" : "transition-all duration-300 ease-out",
        props.class,
      )}
      style={
        {
          "--widget-fill-value": props.value,
          "z-index": WIDGET_Z.BACKGROUND,
        } as JSX.CSSProperties
      }
    />
  );
}
