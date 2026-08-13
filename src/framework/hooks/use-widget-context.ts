import { createContext, useContext } from "solid-js";

/**
 * Reactive widget context.
 *
 * Visual scale (icon size, text size, padding, layout direction) lives in
 * CSS via container queries on `.glasshome-widget`. This context only
 * carries host RPC (updateConfig, dialog opener, service calls) plus the
 * deprecated `dimensions` accessor; size reads go through
 * `useWidgetDimensions()`, which only exists inside `<Widget>`.
 */
export interface WidgetDimensions {
  width: number;
  height: number;
}

/** Capability-routed service call: an RPC into the host's HA bridge worker,
    validated there against the widget's granted capabilities. Pass
    `{ returnResponse: true }` for services that return data (e.g.
    `todo.get_items`); the resolved value is the HA service response, else
    `undefined`. */
export type ServiceCallFn = (
  domain: string,
  service: string,
  serviceData?: Record<string, unknown>,
  target?: Record<string, unknown>,
  options?: { returnResponse?: boolean },
) => Promise<unknown>;

export interface ReactiveWidgetContext {
  updateConfig: (config: Record<string, unknown>) => void;
  /**
   * Measured shell dimensions in CSS px. (0,0) before first layout.
   * @deprecated since 1.9.0, removed in 2.0.0. Use `useWidgetDimensions()`
   * (throws outside `<Widget>` instead of silently reading the host stub).
   */
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
