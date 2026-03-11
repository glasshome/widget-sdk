/**
 * Debug Data Hook
 *
 * Generates standardized debug data structure for widget dialogs.
 * Provides a consistent format for troubleshooting widget configuration and entity state.
 *
 * @example
 * ```tsx
 * const debugData = useDebugData({
 *   widgetConfig: {
 *     id: config.id,
 *     type: config.type,
 *     title: config.title,
 *     entityIds: config.entityIds,
 *   },
 *   entities: () => coverEntities,
 *   customEntityFields: (entity) => ({
 *     current_position: entity.attributes?.current_position,
 *   }),
 * });
 * ```
 */

import { type Accessor, createMemo } from "solid-js";
import type { EntityView } from "../types";

export interface UseDebugDataOptions {
  /** Widget configuration summary */
  widgetConfig: {
    id: string;
    type: string;
    title?: string;
    entityIds?: string[];
  };
  /** Reactive entities accessor */
  entities: Accessor<EntityView[]>;
  /** Additional data to include in debug output */
  additionalData?: Record<string, unknown>;
  /** Custom entity fields to include per entity */
  customEntityFields?: (entity: EntityView) => Record<string, unknown>;
}

/**
 * Hook for generating standardized debug data structure
 *
 * @param options - Debug data configuration
 * @returns Reactive debug data object or undefined if no entities
 */
export function useDebugData(
  options: UseDebugDataOptions,
): Accessor<Record<string, unknown> | undefined> {
  return createMemo(() => {
    const entities = options.entities();
    if (entities.length === 0) return undefined;

    const data: Record<string, unknown> = {
      widgetConfig: options.widgetConfig,
      entities: entities.map((e) => {
        const baseFields = {
          entity_id: e.id,
          state: e.state,
          domain: e.domain,
          friendly_name: e.friendlyName,
        };

        if (options.customEntityFields) {
          return {
            ...baseFields,
            ...options.customEntityFields(e),
          };
        }

        return baseFields;
      }),
    };

    if (options.additionalData) {
      Object.assign(data, options.additionalData);
    }

    return data;
  });
}
