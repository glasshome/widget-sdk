import type { WidgetDefinition } from "./types";

/**
 * Define a widget and return its definition for registration with the dashboard.
 *
 * The dashboard renders widgets as plain SolidJS components via <Dynamic>,
 * so no Web Component registration is needed.
 *
 * @template C - Widget configuration type
 */
export function defineWidget<C = Record<string, unknown>>(
  definition: WidgetDefinition<C>,
): WidgetDefinition<C> {
  return definition;
}
