/**
 * Framework Hooks - Barrel Export
 *
 * Hooks for widget development: context, dialog, entity group.
 */

// Context
export {
  type ReactiveWidgetContext,
  useWidgetContext,
  WidgetCtx,
} from "./use-widget-context";
// Dialog
export { useWidgetDialog, type WidgetDialogReturn } from "./use-widget-dialog";
// Entity Group
export {
  type AggregationPreset,
  type UseWidgetEntityGroupOptions,
  type UseWidgetEntityGroupResult,
  useWidgetEntityGroup,
} from "./use-widget-entity-group";
