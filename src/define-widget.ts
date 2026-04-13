import { extractDefaults, toFormSchema } from "./framework/to-form-schema";
import type { WidgetDefinition } from "./types";

/**
 * Define a widget and return its definition for registration with the dashboard.
 *
 * When `configSchema` (Zod) is provided, auto-populates `manifest.schema` (JSON Schema)
 * and `manifest.defaultConfig` for backward compatibility with existing consumers.
 *
 * @template C - Widget configuration type
 */
export function defineWidget<C = Record<string, unknown>>(
	definition: WidgetDefinition<C>,
): WidgetDefinition<C> {
	if (definition.configSchema) {
		if (!definition.manifest.schema) {
			definition.manifest.schema = toFormSchema(definition.configSchema);
		}
		if (!definition.manifest.defaultConfig) {
			definition.manifest.defaultConfig = extractDefaults(definition.configSchema);
		}
	}
	return definition;
}
