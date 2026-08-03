import { createContext, useContext } from "solid-js";
import type { WidgetDimensions } from "./use-widget-context";

export type WidgetDimensionsAccessor = () => WidgetDimensions;

/**
 * Provided only by `<Widget>` (ResizeObserver-measured shell box). Unlike
 * `WidgetCtx`, the host's pre-`<Widget>` stub never provides it, so a read
 * from the wrong scope throws instead of silently returning (0,0).
 */
export const WidgetSizeCtx = createContext<WidgetDimensionsAccessor>();

/**
 * Reactive accessor for the widget shell's measured dimensions (CSS px,
 * (0,0) before first layout). Must be called inside `<Widget>`; called from
 * the top-level widget scope it throws instead of freezing on the host stub.
 */
export function useWidgetDimensions(): WidgetDimensionsAccessor {
  const dimensions = useContext(WidgetSizeCtx);
  if (!dimensions) {
    throw new Error(
      "useWidgetDimensions must be called inside <Widget>: move the call into a component rendered within <Widget> (the top-level widget scope only sees the host stub).",
    );
  }
  return dimensions;
}
