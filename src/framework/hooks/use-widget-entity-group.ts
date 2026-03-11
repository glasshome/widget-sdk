/**
 * Widget Entity Group Hook
 *
 * Generalized multi-entity data binding that accepts a signal-based array data source.
 * Supports aggregation presets for common entity domains (lights, sensors, etc.).
 *
 * @example
 * ```tsx
 * // Host provides entities as a signal array
 * const entities = () => syncLayer.getEntities(config.entityIds);
 *
 * const { groupData, emptyState, hasEntities, count } = useWidgetEntityGroup({
 *   entities,
 *   aggregationMode: () => "light",
 *   emptyStateConfig: {
 *     icon: <Lightbulb />,
 *     title: "No lights",
 *     message: "Configure this widget to add lights",
 *   },
 * });
 * ```
 */

import { type Accessor, createMemo } from "solid-js";
import type { EntityView } from "../types";
import type { WidgetEmptyStateConfig } from "../utils/empty-state";
import {
  calculateLightGroup,
  calculateSensorGroup,
  type LightGroupResult,
  type SensorGroupResult,
  type SensorGroupType,
} from "../utils/entity-aggregation";

/**
 * Aggregation preset types for common entity domains
 */
export type AggregationPreset = "binary-sensor" | "light" | "sensor" | "switch" | "none";

export interface UseWidgetEntityGroupOptions<TData = unknown> {
  /** Reactive entities array accessor */
  entities: Accessor<EntityView[]>;
  /** Optional custom data calculation function */
  calculateGroupData?: (entities: EntityView[]) => TData;
  /** Aggregation mode accessor (optional, alternative to calculateGroupData) */
  aggregationMode?: Accessor<AggregationPreset | undefined>;
  /** Sensor group calculation mode (for "sensor" preset) */
  sensorGroupType?: Accessor<SensorGroupType>;
  /** All entities mode - all must be on for group to be "on" (for "light"/"switch" presets) */
  allEntitiesMode?: boolean;
  /** Empty state configuration when no entities are available */
  emptyStateConfig: WidgetEmptyStateConfig;
  /** Minimum entities required (default: 1) */
  minEntities?: number;
}

export interface UseWidgetEntityGroupResult<TData = unknown> {
  /** All entities accessor */
  entities: Accessor<EntityView[]>;
  /** Custom calculated data (null if insufficient entities or no calculateGroupData provided) */
  groupData: Accessor<TData | null>;
  /** Aggregated data from preset (undefined if no aggregation preset used) */
  aggregatedData: Accessor<LightGroupResult | SensorGroupResult | undefined>;
  /** Empty state config (undefined if entities exist) */
  emptyState: Accessor<WidgetEmptyStateConfig | undefined>;
  /** Whether minimum entities are present */
  hasEntities: Accessor<boolean>;
  /** Entity count */
  count: Accessor<number>;
}

/**
 * Hook for multi-entity widgets with integrated empty state support and aggregation presets
 *
 * @param options - Entities source, aggregation config, and empty state
 * @returns Reactive group data, aggregation, empty state, and counts
 */
export function useWidgetEntityGroup<TData = unknown>(
  options: UseWidgetEntityGroupOptions<TData>,
): UseWidgetEntityGroupResult<TData> {
  const minEntities = options.minEntities ?? 1;

  const count = createMemo(() => options.entities().length);

  const hasEntities = createMemo(() => count() >= minEntities);

  const groupData = createMemo((): TData | null => {
    if (!hasEntities() || !options.calculateGroupData) return null;
    return options.calculateGroupData(options.entities());
  });

  const aggregatedData = createMemo((): LightGroupResult | SensorGroupResult | undefined => {
    if (!hasEntities()) return undefined;

    const preset = options.aggregationMode?.();
    if (!preset || preset === "none") return undefined;

    const ents = options.entities();

    // Use calculateLightGroup for light, binary-sensor, and switch presets
    if (preset === "light" || preset === "binary-sensor" || preset === "switch") {
      return calculateLightGroup(ents, options.allEntitiesMode);
    }

    // Use calculateSensorGroup for sensor preset
    if (preset === "sensor") {
      const sensorType = options.sensorGroupType?.() ?? "mean";
      return calculateSensorGroup(ents, sensorType, true);
    }

    return undefined;
  });

  const emptyState = createMemo(() => {
    return hasEntities() ? undefined : options.emptyStateConfig;
  });

  return {
    entities: options.entities,
    groupData,
    aggregatedData,
    emptyState,
    hasEntities,
    count,
  };
}
