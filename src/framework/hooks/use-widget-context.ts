/**
 * Widget Context Hook
 *
 * Provides access to widget context (size, orientation, dimensions, edit mode).
 *
 * @example
 * ```tsx
 * const ctx = useWidgetContext();
 *
 * return (
 *   <div>
 *     {ctx.size() !== "xs" && <DetailedMetrics />}
 *     {ctx.orientation() === "vertical" && <VerticalLayout />}
 *   </div>
 * );
 * ```
 */

import { createContext, useContext } from "solid-js";
import type { WidgetDimensions, WidgetOrientation, WidgetSize } from "../types";

/**
 * Reactive widget context value
 * Uses accessor functions for SolidJS fine-grained reactivity
 */
export interface ReactiveWidgetContext {
  /** Widget size classification accessor */
  size: () => WidgetSize;
  /** Widget orientation accessor (for gestures - pure aspect ratio) */
  orientation: () => WidgetOrientation;
  /** Content layout direction accessor (for UI arrangement - considers height) */
  contentLayout: () => WidgetOrientation;
  /** Widget dimensions accessor */
  dimensions: () => WidgetDimensions;
  /** Whether widget is in edit mode */
  isEditMode: () => boolean;
  /** Update widget config (persists to host) */
  updateConfig: (config: Record<string, unknown>) => void;
}

/**
 * Widget context
 * Uses reactive accessor pattern for SolidJS
 */
export const WidgetCtx = createContext<ReactiveWidgetContext>();

/**
 * Access widget context
 * @throws Error if used outside Widget component
 */
export function useWidgetContext(): ReactiveWidgetContext {
  const context = useContext(WidgetCtx);

  if (!context) {
    throw new Error("useWidgetContext must be used within a Widget component");
  }

  return context;
}
