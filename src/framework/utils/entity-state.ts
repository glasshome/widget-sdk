/**
 * Entity State Utilities
 *
 * Common entity state calculations that widgets repeatedly implement.
 * These utilities provide domain-agnostic state checking and counting.
 *
 * For aggregation of multiple entities, see entity-aggregation.ts utilities
 * (calculateLightGroup, calculateSensorGroup).
 */

import type { EntityView } from "../types";

/**
 * Check if entity is active (on, open, locked, etc.)
 * Domain-aware state checking
 *
 * @example
 * ```typescript
 * const isActive = isEntityActive(entity);
 * const statusColor = isActive ? "green" : "gray";
 * ```
 */
export function isEntityActive(entity: EntityView | null | undefined): boolean {
  if (!entity) return false;

  // Binary states
  if (["on", "open", "locked", "home", "playing", "active"].includes(entity.state)) {
    return true;
  }

  // Numeric threshold (for sensors)
  if (entity.domain === "sensor") {
    const numValue = Number.parseFloat(entity.state);
    return !isNaN(numValue) && numValue > 0;
  }

  return false;
}

/**
 * Get entity attribute with type safety
 *
 * @example
 * ```typescript
 * const brightness = getEntityAttribute<number>(entity, "brightness", 0);
 * const temperature = getEntityAttribute<number>(entity, "current_temperature");
 * ```
 */
export function getEntityAttribute<T = unknown>(
  entity: EntityView | null | undefined,
  attributeName: string,
  fallback?: T,
): T | undefined {
  if (!entity?.attributes) return fallback;
  return (entity.attributes[attributeName] as T) ?? fallback;
}

/**
 * Count active entities (on, open, etc.)
 *
 * @example
 * ```typescript
 * const activeCount = countActiveEntities(entities);
 * return <Widget.Status>{activeCount} active</Widget.Status>;
 * ```
 */
export function countActiveEntities(entities: EntityView[]): number {
  return entities.filter(isEntityActive).length;
}
