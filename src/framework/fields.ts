import { z } from "zod";

/**
 * Pre-built Zod field helpers for common widget config patterns.
 * Each helper returns a Zod schema with `.meta()` annotations that
 * SchemaForm uses to render the appropriate UI (entity picker, area picker, etc.).
 */
export const widgetFields = {
	/** Optional display name override (renders as text input) */
	title: () =>
		z
			.string()
			.optional()
			.meta({ title: "Title", description: "Optional display name override" }),

	/** Multi-select entity picker for a HA domain */
	entityIds: (domain: string, options?: { deviceClass?: string }) =>
		z
			.array(z.string())
			.default([])
			.meta({
				domain,
				title: "Entities",
				...(options?.deviceClass ? { deviceClass: options.deviceClass } : {}),
			}),

	/** Single-select entity picker for a HA domain */
	singleEntity: (domain: string, options?: { deviceClass?: string }) =>
		z
			.array(z.string())
			.default([])
			.meta({
				domain,
				title: "Entity",
				singleSelect: true,
				...(options?.deviceClass ? { deviceClass: options.deviceClass } : {}),
			}),

	/** Area picker dropdown */
	areaId: () =>
		z
			.string()
			.optional()
			.meta({ formType: "area-picker", title: "Area" }),
};
