/**
 * Widget Entity Hook
 *
 * Generalized single-entity data binding that accepts a signal-based data source.
 * The SDK does NOT import sync-layer -- the host provides entity data via Accessor.
 *
 * @example
 * ```tsx
 * // Host provides entity data as a signal
 * const entity = () => syncLayer.getEntity("sensor.temperature");
 *
 * const { data, emptyState, hasEntity } = useWidgetEntity({
 *   entity,
 *   calculateData: (e) => ({
 *     temperature: parseFloat(e.state),
 *     unit: e.unitOfMeasurement ?? "C",
 *   }),
 *   emptyStateConfig: {
 *     icon: <Thermometer />,
 *     title: "No climate entity",
 *     message: "Configure this widget to add a climate device",
 *   },
 * });
 * ```
 */

import { type Accessor, createMemo } from "solid-js";
import type { EntityView } from "../types";
import type { WidgetEmptyStateConfig } from "../utils/empty-state";

export interface UseWidgetEntityOptions<TData> {
  /** Reactive entity accessor (null when not available) */
  entity: Accessor<EntityView | null>;
  /** Function to calculate widget-specific data from entity */
  calculateData: (entity: EntityView) => TData;
  /** Empty state configuration when entity is not available */
  emptyStateConfig: WidgetEmptyStateConfig;
}

export interface UseWidgetEntityResult<TData> {
  /** The entity (null if not found) */
  entity: Accessor<EntityView | null>;
  /** Calculated widget data (null if no entity) */
  data: Accessor<TData | null>;
  /** Empty state config (undefined if entity exists) */
  emptyState: Accessor<WidgetEmptyStateConfig | undefined>;
  /** Whether entity exists */
  hasEntity: Accessor<boolean>;
}

/**
 * Hook for single-entity widgets with integrated empty state support
 *
 * @param options - Entity source, data calculation, and empty state config
 * @returns Reactive entity data, empty state, and existence check
 */
export function useWidgetEntity<TData>(
  options: UseWidgetEntityOptions<TData>,
): UseWidgetEntityResult<TData> {
  const hasEntity = createMemo(() => options.entity() !== null);

  const data = createMemo(() => {
    const e = options.entity();
    if (!e) return null;
    return options.calculateData(e);
  });

  const emptyState = createMemo(() => {
    return hasEntity() ? undefined : options.emptyStateConfig;
  });

  return {
    entity: options.entity,
    data,
    emptyState,
    hasEntity,
  };
}
