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
 * Setter functions used by Widget.tsx to write real measured values into
 * the stub context created by WidgetSlot before Widget mounts and measures.
 */
export interface BridgeFns {
  setSize: (v: WidgetSize) => void;
  setOrientation: (v: WidgetOrientation) => void;
  setContentLayout: (v: WidgetOrientation) => void;
  setDimensions: (v: WidgetDimensions) => void;
  setIsStub: (v: boolean) => void;
}

/**
 * Bridgeable widget context — extends ReactiveWidgetContext with internal
 * fields used by the host (WidgetSlot + Widget.tsx) to make stub accessors
 * reactive. Widget authors never see or use these fields; useWidgetContext()
 * still returns ReactiveWidgetContext.
 */
export interface BridgeableWidgetContext extends ReactiveWidgetContext {
  /** True while Widget has not yet measured and updated the stub values */
  _isStub: () => boolean;
  /** Setter functions called by Widget.tsx createEffect to push real values */
  _bridge: BridgeFns;
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
