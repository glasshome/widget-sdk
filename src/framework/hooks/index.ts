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
  type WidgetDimensions,
} from "./use-widget-context";
// Dimensions (provided only inside <Widget>)
export {
  useWidgetDimensions,
  type WidgetDimensionsAccessor,
  WidgetSizeCtx,
} from "./use-widget-dimensions";
// Intersection pause
export { useIntersectionPause } from "./use-intersection-pause";
// Reduced motion
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
