/**
 * Framework Hooks - Barrel Export
 *
 * All hooks for widget development: context, responsive, dialog, form,
 * config, entity, entity group, debug data, and gestures.
 */

// Gestures (re-export from gestures directory for convenience)
export { type GestureHandlers, useWidgetGestures } from "../gestures/use-widget-gestures";
// Debug
export { type UseDebugDataOptions, useDebugData } from "./use-debug-data";
// Config
export {
  type UseWidgetConfigOptions,
  type UseWidgetConfigReturn,
  useWidgetConfig,
} from "./use-widget-config";
// Context
export { type ReactiveWidgetContext, useWidgetContext, WidgetCtx } from "./use-widget-context";
// Dialog
export { useWidgetDialog, type WidgetDialogReturn } from "./use-widget-dialog";

// Entity
export {
  type UseWidgetEntityOptions,
  type UseWidgetEntityResult,
  useWidgetEntity,
} from "./use-widget-entity";

// Entity Group
export {
  type AggregationPreset,
  type UseWidgetEntityGroupOptions,
  type UseWidgetEntityGroupResult,
  useWidgetEntityGroup,
} from "./use-widget-entity-group";
// Form
export {
  type UseWidgetFormOptions,
  type UseWidgetFormReturn,
  useWidgetForm,
} from "./use-widget-form";
// Responsive
export { useWidgetResponsive, type WidgetResponsiveUtils } from "./use-widget-responsive";
