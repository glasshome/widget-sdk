/**
 * SolidJS-specific utility — NOT part of the framework-agnostic SDK contract.
 * This module uses SolidJS signals for reactive entity state management.
 * It is exported from the SDK as a convenience for SolidJS widget authors.
 */
import { type Accessor, createSignal } from "solid-js";

export interface Entity {
  id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_updated?: string;
}

/**
 * Create a reactive entity signal. Returns a signal accessor that tracks
 * entity state changes.
 *
 * NOTE: The setter from `createSignal` is intentionally destructured away.
 * The signal infrastructure is kept in place so that when the sync-layer is
 * ported, the runtime can update entity state reactively without changing
 * the public API surface. Until then the accessor behaves as a constant.
 */
export function createEntity(initialState: Entity): Accessor<Entity> {
  const [entity] = createSignal(initialState);
  return entity;
}
