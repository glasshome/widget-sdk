/**
 * Empty State Utilities
 *
 * Helper functions for creating consistent empty state configurations across widgets.
 */

import type { JSX } from "solid-js";

/**
 * Empty state configuration for a widget
 */
export interface WidgetEmptyStateConfig {
  /** Icon to display */
  icon: JSX.Element;
  /** Main title/heading */
  title: string;
  /** Descriptive message */
  message: string;
}

export interface EmptyStateConfigOptions {
  /** Icon to display */
  icon: JSX.Element;
  /** Main title/heading */
  title: string;
  /** Descriptive message (optional - uses default template if not provided) */
  message?: string;
  /** Entity type for default message template (e.g., "a light", "a lock") */
  entityType?: string;
}

/**
 * Creates a consistent empty state configuration for widgets
 *
 * @example
 * ```typescript
 * // Custom message
 * const config = createEmptyStateConfig({
 *   icon: <Thermometer />,
 *   title: "No climate entity",
 *   message: "Configure this widget to add a climate device",
 * });
 *
 * // Default message template
 * const config = createEmptyStateConfig({
 *   icon: <Lock />,
 *   title: "No lock entity",
 *   entityType: "a lock",
 * });
 * // Result: message = "Configure this widget to add a lock"
 * ```
 */
export function createEmptyStateConfig(options: EmptyStateConfigOptions): WidgetEmptyStateConfig {
  return {
    icon: options.icon,
    title: options.title,
    message: options.message || `Configure this widget to add ${options.entityType || "an entity"}`,
  };
}
