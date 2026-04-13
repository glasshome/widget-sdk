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
			.meta({ label: "Title", description: "Optional display name override" }),

	/** Multi-select entity picker for a HA domain */
	entityIds: (domain: string) =>
		z.array(z.string()).default([]).meta({ domain, label: "Entities" }),

	/** Single-select entity picker for a HA domain */
	singleEntity: (domain: string) =>
		z
			.array(z.string())
			.default([])
			.meta({ domain, label: "Entity", singleSelect: true }),

	/** Area picker dropdown */
	areaId: () =>
		z
			.string()
			.optional()
			.meta({ formType: "area-picker", label: "Area" }),
};
