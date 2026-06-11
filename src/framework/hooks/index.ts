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
} from "./use-widget-context";
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
