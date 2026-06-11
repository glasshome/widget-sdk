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

/** Capability-routed service call: an RPC into the host's HA bridge worker,
    validated there against the widget's granted capabilities. */
export type ServiceCallFn = (
  domain: string,
  service: string,
  serviceData?: Record<string, unknown>,
  target?: Record<string, unknown>,
) => Promise<void>;

export interface ReactiveWidgetContext {
  isEditMode: () => boolean;
  updateConfig: (config: Record<string, unknown>) => void;
  /** Measured shell dimensions in CSS px. (0,0) before first layout. */
  dimensions: () => WidgetDimensions;
  /** Host RPC: `useWidgetDialog` registers its opener here so the host can
      open the widget's dialog on a chosen tab. Called with `null` on cleanup. */
  registerDialogOpener?: (open: ((tab?: string) => void) | null) => void;
  /** Present when the host mounts the widget; the service hooks route
      through it. Absent in previews/tests (direct sync-layer fallback). */
  callService?: ServiceCallFn;
}

export const WidgetCtx = createContext<ReactiveWidgetContext>();

export function useWidgetContext(): ReactiveWidgetContext {
  const context = useContext(WidgetCtx);
  if (!context) {
    throw new Error("useWidgetContext must be used within a Widget component");
  }
  return context;
}
