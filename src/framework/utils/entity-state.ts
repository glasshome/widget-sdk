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
 * Check if entity is available (not unavailable/unknown)
 *
 * @example
 * ```typescript
 * const isAvailable = isEntityAvailable(entity);
 * if (isAvailable) {
 *   // Entity is available, can display state
 * }
 * ```
 */
export function isEntityAvailable(entity: EntityView | null | undefined): boolean {
  if (!entity) return false;
  return entity.state !== "unavailable" && entity.state !== "unknown";
}

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
 * Get entity state with fallback
 *
 * @example
 * ```typescript
 * const state = getEntityState(entity, "unknown");
 * return <Widget.Status>{state}</Widget.Status>;
 * ```
 */
export function getEntityState(
  entity: EntityView | null | undefined,
  fallback = "unknown",
): string {
  return entity?.state ?? fallback;
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
 * Count entities by state
 *
 * @example
 * ```typescript
 * const onCount = countEntitiesByState(entities, "on");
 * return <Widget.Status>{onCount} lights on</Widget.Status>;
 * ```
 */
export function countEntitiesByState(entities: EntityView[], state: string): number {
  return entities.filter((e) => e.state === state).length;
}

/**
 * Count available entities (excludes unavailable/unknown)
 *
 * @example
 * ```typescript
 * const availableCount = countAvailableEntities(entities);
 * const unavailableCount = entities.length - availableCount;
 * ```
 */
export function countAvailableEntities(entities: EntityView[]): number {
  return entities.filter(isEntityAvailable).length;
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

/**
 * Check if all entities match state
 *
 * @example
 * ```typescript
 * const allOn = allEntitiesInState(entities, "on");
 * const statusText = allOn ? "All on" : "Mixed";
 * ```
 */
export function allEntitiesInState(entities: EntityView[], state: string): boolean {
  return entities.length > 0 && entities.every((e) => e.state === state);
}

/**
 * Check if any entity matches state
 *
 * @example
 * ```typescript
 * const anyOpen = anyEntityInState(entities, "open");
 * const iconColor = anyOpen ? "red" : "green";
 * ```
 */
export function anyEntityInState(entities: EntityView[], state: string): boolean {
  return entities.some((e) => e.state === state);
}
