import type { WidgetDefinition, WidgetType } from "./types";

/**
 * Define a widget and return its definition for registration with the dashboard.
 *
 * The dashboard renders widgets as plain SolidJS components via <Dynamic>,
 * so no Web Component registration is needed.
 *
 * @template T - Widget type (chart, status, control)
 * @template C - Widget configuration type
 */
export function defineWidget<T extends WidgetType, C = Record<string, unknown>>(
  definition: WidgetDefinition<T, C>,
): WidgetDefinition<T, C> {
  return definition;
}
