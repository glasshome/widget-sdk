import { createContext, useContext } from "solid-js";

/**
 * Reactive widget context.
 *
 * Visual scale (icon size, text size, padding, layout direction) lives in
 * CSS via container queries on `.glasshome-widget`. This context only
 * carries:
 *   - host RPC (updateConfig)
 *   - edit-mode flag
 *   - raw measured dimensions (for widgets that branch rendered content
 *     based on size — e.g. hide a forecast strip on small chips).
 *
 * Widgets decide their own thresholds; there is no shared size tier.
 */
export interface WidgetDimensions {
  width: number;
  height: number;
}

export interface ReactiveWidgetContext {
  isEditMode: () => boolean;
  updateConfig: (config: Record<string, unknown>) => void;
  /** Measured shell dimensions in CSS px. (0,0) before first layout. */
  dimensions: () => WidgetDimensions;
}

export const WidgetCtx = createContext<ReactiveWidgetContext>();

export function useWidgetContext(): ReactiveWidgetContext {
  const context = useContext(WidgetCtx);
  if (!context) {
    throw new Error("useWidgetContext must be used within a Widget component");
  }
  return context;
}
