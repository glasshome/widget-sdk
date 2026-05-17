/**
 * Framework Utilities - Barrel Export (internal)
 *
 * Public exports are routed through src/framework/index.ts. Files that remain
 * in this directory are still consumed internally even when not part of the
 * public re-export surface.
 */

export { cn } from "./cn";
export {
  calculateLightGroup,
  calculateSensorGroup,
  type LightGroupResult,
  type SensorGroupResult,
  type SensorGroupType,
} from "./entity-aggregation";
export {
  countActiveEntities,
  getEntityAttribute,
  isEntityActive,
} from "./entity-state";
export { formatValue } from "./format-value";
export { interpretValue } from "./interpret-value";
