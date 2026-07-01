import { z } from "zod";
import { deprecate } from "../deprecations";

/**
 * Pre-built Zod field helpers for common widget config patterns.
 *
 * @deprecated since 1.4.0, removed in 2.0.0. Use the config API instead:
 * `defineConfig` + `field.*` (`field.title()`, `field.entities()`, `field.entity()`,
 * `field.area()`). See https://glasshome.app/docs/widget-sdk/config
 */
export const widgetFields = {
	/**
	 * Optional display name override (renders as text input).
	 * @deprecated since 1.4.0, removed in 2.0.0. Use `field.title()`.
	 */
	title: deprecate(
		() =>
			z
				.string()
				.optional()
				.meta({ title: "Title", description: "Optional display name override" }),
		"widgetFields.title",
	),

	/**
	 * Multi-select entity picker for a HA domain.
	 * @deprecated since 1.4.0, removed in 2.0.0. Use `field.entities(domain, options?)`.
	 */
	entityIds: deprecate(
		(domain: string, options?: { deviceClass?: string }) =>
			z
				.array(z.string())
				.default([])
				.meta({
					domain,
					title: "Entities",
					...(options?.deviceClass ? { deviceClass: options.deviceClass } : {}),
				}),
		"widgetFields.entityIds",
	),

	/**
	 * Single-select entity picker for a HA domain.
	 * @deprecated since 1.4.0, removed in 2.0.0. Use `field.entity(domain, options?)`.
	 */
	singleEntity: deprecate(
		(domain: string, options?: { deviceClass?: string }) =>
			z
				.array(z.string())
				.default([])
				.meta({
					domain,
					title: "Entity",
					singleSelect: true,
					...(options?.deviceClass ? { deviceClass: options.deviceClass } : {}),
				}),
		"widgetFields.singleEntity",
	),

	/**
	 * Area picker dropdown.
	 * @deprecated since 1.4.0, removed in 2.0.0. Use `field.area()`.
	 */
	areaId: deprecate(
		() =>
			z
				.string()
				.optional()
				.meta({ formType: "area-picker", title: "Area" }),
		"widgetFields.areaId",
	),
};
