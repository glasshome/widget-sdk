/**
 * Framework Utilities - Barrel Export
 *
 * Helper functions for value formatting, entity state management,
 * and class name composition.
 */

export { cn } from "./cn";
export {
  createEmptyStateConfig,
  type EmptyStateConfigOptions,
  type WidgetEmptyStateConfig,
} from "./empty-state";
export {
  calculateLightGroup,
  calculateSensorGroup,
  type LightGroupResult,
  type SensorGroupResult,
  type SensorGroupType,
} from "./entity-aggregation";
export {
  allEntitiesInState,
  anyEntityInState,
  countActiveEntities,
  countAvailableEntities,
  countEntitiesByState,
  getEntityAttribute,
  getEntityState,
  isEntityActive,
  isEntityAvailable,
} from "./entity-state";
export { formatValue } from "./format-value";
export { interpretValue } from "./interpret-value";
