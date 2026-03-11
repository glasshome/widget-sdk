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
 *   spacing,
 *   cn,
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
export { WidgetEmptyState } from "./components/WidgetEmptyState";
export { WidgetIcon } from "./components/WidgetIcon";
export { WidgetMetrics } from "./components/WidgetMetrics";
export { WidgetStatus } from "./components/WidgetStatus";
export { WidgetSubtitle } from "./components/WidgetSubtitle";
export { WidgetTitle } from "./components/WidgetTitle";
export { WidgetValue } from "./components/WidgetValue";

// ============================================================================
// Background Components
// ============================================================================

export { Glow } from "./backgrounds/Glow";
export { WidgetSliderFill } from "./backgrounds/WidgetSliderFill";

// ============================================================================
// Layout Components
// ============================================================================

export { WidgetStack } from "./layout/WidgetStack";

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
  type UseDebugDataOptions,
  type UseWidgetConfigOptions,
  type UseWidgetConfigReturn,
  type UseWidgetEntityGroupOptions,
  type UseWidgetEntityGroupResult,
  type UseWidgetEntityOptions,
  type UseWidgetEntityResult,
  type UseWidgetFormOptions,
  type UseWidgetFormReturn,
  useDebugData,
  useWidgetConfig,
  useWidgetContext,
  useWidgetDialog,
  useWidgetEntity,
  useWidgetEntityGroup,
  useWidgetForm,
  useWidgetResponsive,
  WidgetCtx,
  type WidgetDialogReturn,
  type WidgetResponsiveUtils,
} from "./hooks";

// ============================================================================
// Gestures
// ============================================================================

export { type GestureHandlers, useWidgetGestures } from "./gestures/use-widget-gestures";

// ============================================================================
// Design System
// ============================================================================

export { getSpacingClass, spacing } from "./design-system/spacing";
export { typography } from "./design-system/typography";
export { WIDGET_Z, type WidgetZIndex } from "./design-system/z-index";

// ============================================================================
// Theming
// ============================================================================

export {
  GRADIENT_NAMES,
  GRADIENT_PRESET_KEYS,
  GRADIENT_PRESETS,
  type GradientPreset,
  getGradient,
  getGradientFromString,
  gradientColorPresets,
  stateColors,
  type WidgetColorPreset,
} from "./theming";

// ============================================================================
// Variant System
// ============================================================================

export {
  applyCssVars,
  applyLayout,
  builtInVariants,
  classicGlass,
  compactHorizontal,
  composeVariants,
  createFlexLayout,
  extendVariant,
  getBuiltInVariant,
  getBuiltInVariantIds,
  isBuiltInVariant,
  mergeVariants,
  minimal,
} from "./variants";

// ============================================================================
// Utilities
// ============================================================================

export {
  allEntitiesInState,
  anyEntityInState,
  calculateLightGroup,
  calculateSensorGroup,
  cn,
  countActiveEntities,
  countAvailableEntities,
  countEntitiesByState,
  createEmptyStateConfig,
  type EmptyStateConfigOptions,
  formatValue,
  getEntityAttribute,
  getEntityState,
  interpretValue,
  isEntityActive,
  isEntityAvailable,
  type LightGroupResult,
  type SensorGroupResult,
  type SensorGroupType,
  type WidgetEmptyStateConfig,
} from "./utils";

// ============================================================================
// Types (re-export all)
// ============================================================================

export type {
  AbsoluteLayoutStrategy,
  BaseComponentProps,
  ColorVariant,
  CustomLayoutStrategy,
  ElementConfig,
  EntityView,
  FlexLayoutStrategy,
  GestureConfig,
  GradientConfig,
  GridLayoutStrategy,
  HoldGestureConfig,
  ImageOverlay,
  InteractionConfig,
  LayoutStrategy,
  PositionConfig,
  SlideGestureConfig,
  SpacingScale,
  VariantPlugins,
  VariantRegistry,
  WidgetContextValue,
  WidgetDimensions,
  WidgetElement,
  WidgetOrientation,
  WidgetSize,
  WidgetStyles,
  WidgetVariant,
  WidgetVariantConfig,
} from "./types";
