/**
 * Widget Framework - Main Barrel Export
 *
 * A SolidJS framework for building GlassHome widgets with minimal boilerplate.
 * This is the single entry point for the entire framework module.
 *
 * @example
 * ```tsx
 * import {
 *   Widget,
 *   useWidgetGestures,
 *   useWidgetDialog,
 * } from "@glasshome/widget-sdk";
 *
 * export function MyWidget(props) {
 *   const { showDialog, openDialog } = useWidgetDialog();
 *   const gestures = useWidgetGestures(
 *     () => ({ tap: handleTap, hold: { action: openDialog } }),
 *     () => ctx.orientation(),
 *   );
 *
 *   return (
 *     <Widget>
 *       <Widget.Icon icon={<Power />} color="blue" />
 *       <Widget.Title>My Widget</Widget.Title>
 *       <Widget.Status>Active</Widget.Status>
 *     </Widget>
 *   );
 * }
 * ```
 */

// ============================================================================
// Core Components
// ============================================================================

export { Widget } from "./core/Widget";

// ============================================================================
// Slot Components (also available via Widget.Icon etc.)
// ============================================================================

export { WidgetContent } from "./components/WidgetContent";
export { WidgetIcon } from "./components/WidgetIcon";
export { WidgetStatus } from "./components/WidgetStatus";
export { WidgetTitle } from "./components/WidgetTitle";
export { WidgetValue } from "./components/WidgetValue";

// ============================================================================
// Background Components
// ============================================================================

export { WidgetSliderFill } from "./backgrounds/WidgetSliderFill";

// ============================================================================
// Dialog Components
// ============================================================================

export { WidgetDialog, type WidgetDialogProps, type WidgetDialogTab } from "./dialogs";

// ============================================================================
// Hooks
// ============================================================================

export {
  type AggregationPreset,
  type ReactiveWidgetContext,
  type UseWidgetEntityGroupOptions,
  type UseWidgetEntityGroupResult,
  useIntersectionPause,
  useReducedMotion,
  useWidgetContext,
  useWidgetDialog,
  useWidgetEntityGroup,
  WidgetCtx,
  type WidgetDialogReturn,
} from "./hooks";

// ============================================================================
// Gestures
// ============================================================================

export { type GestureHandlers, useWidgetGestures } from "./gestures/use-widget-gestures";

// ============================================================================
// Theming
// ============================================================================

export {
  injectTokens,
  type SvgColorKey,
  svgColors,
  type Tone,
  ToneSchema,
} from "./theming";

// ============================================================================
// Config Schema Helpers
// ============================================================================

export { widgetFields } from "./fields";

// ============================================================================
// Utilities
// ============================================================================

export {
  calculateLightGroup,
  calculateSensorGroup,
  countActiveEntities,
  getEntityAttribute,
  isEntityActive,
  type LightGroupResult,
  type SensorGroupResult,
  type SensorGroupType,
} from "./utils";

// ============================================================================
// Types (re-export all)
// ============================================================================

export type {
  EntityView,
  WidgetStyles,
  WidgetVariantConfig,
} from "./types";
