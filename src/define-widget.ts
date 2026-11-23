import { readBundled } from "@glasshome/widget-contract/i18n-format";
import { createComponent } from "solid-js";
import { I18nProvider } from "./framework/i18n/provider";
import { extractDefaults, toFormSchema } from "./framework/to-form-schema";
import type { WidgetDefinition } from "./types";

const localized = new WeakSet<object>();

/**
 * Define a widget and return its definition for registration with the dashboard.
 *
 * When `configSchema` (Zod) is provided, auto-populates `manifest.schema` (JSON Schema)
 * and `manifest.defaultConfig` for backward compatibility with existing consumers.
 * When `messages` is provided, the component renders with them as its English.
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
  if (definition.messages !== undefined && !localized.has(definition.component)) {
    const messages = readBundled(definition.messages);
    const component = definition.component;
    definition.component = (props) =>
      createComponent(I18nProvider, {
        messages,
        get children() {
          return createComponent(component, props);
        },
      });
    localized.add(definition.component);
  }
  return definition;
}
