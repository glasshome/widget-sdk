/**
 * Framework Hooks - Barrel Export
 *
 * Hooks for widget development: context, dialog, entity group.
 */

// Context
export {
  type ReactiveWidgetContext,
  type ServiceCallFn,
  useWidgetContext,
  WidgetCtx,
  type WidgetDashboard,
  type WidgetMaterial,
  type WidgetViewer,
  type WidgetDimensions,
} from "./use-widget-context";
// Dashboard (host-fed; empty fallback outside a host)
export { useWidgetDashboard } from "./use-widget-dashboard";
export { useWidgetViewer } from "./use-widget-viewer";
export { useMaterial } from "./use-material";
// Dimensions (provided only inside <Widget>)
export {
  useWidgetDimensions,
  type WidgetDimensionsAccessor,
  WidgetSizeCtx,
} from "./use-widget-dimensions";
// Intersection pause
export { useIntersectionPause } from "./use-intersection-pause";
// Reduced motion
export { type Daylight, type DaylightPhase, useDaylight } from "./use-daylight";
export { useReducedMotion } from "./use-reduced-motion";
// Dialog
export { useWidgetDialog, type WidgetDialogReturn } from "./use-widget-dialog";
// Entity Group
export {
  type AggregationPreset,
  type UseWidgetEntityGroupOptions,
  type UseWidgetEntityGroupResult,
  useWidgetEntityGroup,
} from "./use-widget-entity-group";
