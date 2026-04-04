import { z } from "zod";

/**
 * Runtime validation schemas for widget data structures.
 *
 * These mirror the TypeScript interfaces in types.ts but work at runtime —
 * use them at HTTP and database boundaries to catch type mismatches early
 * instead of letting them surface as cryptic SQLite or JSON errors.
 */

export const GridSizeSchema = z.object({
  w: z.number().int().min(1),
  h: z.number().int().min(1),
});

export const WidgetManifestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  minSize: GridSizeSchema,
  maxSize: GridSizeSchema,
  sdkVersion: z.string().min(1),
  icon: z.string().optional(),
  schema: z.record(z.string(), z.unknown()).optional(),
  defaultConfig: z.record(z.string(), z.unknown()).optional(),
});

const SCOPE_REGEX = /^[a-z0-9][a-z0-9-]*$/;

export const PublishRequestSchema = z.object({
  action: z.literal("request"),
  scope: z.string().regex(SCOPE_REGEX, "Must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  minSize: GridSizeSchema,
  maxSize: GridSizeSchema,
  sdkVersion: z.string().min(1),
  version: z.string().min(1),
  bundleSize: z.number().int().positive(),
  sha256Hash: z.string().min(1),
  manifestJson: z.string().min(1),
});

export const PublishConfirmSchema = z.object({
  action: z.literal("confirm"),
  versionId: z.string().min(1),
});

export const PublishBodySchema = z.discriminatedUnion("action", [
  PublishRequestSchema,
  PublishConfirmSchema,
]);

// ---------------------------------------------------------------------------
// Serialization helpers for DB text columns
// ---------------------------------------------------------------------------

/**
 * Serialize a GridSize to a JSON string for database storage.
 */
export function serializeGridSize(size: z.infer<typeof GridSizeSchema>): string {
  return JSON.stringify(size);
}

/**
 * Parse a GridSize from a database text column or API response.
 * Accepts a JSON string, an already-parsed object, or garbage.
 * Returns the fallback for any value that doesn't validate.
 */
export function parseGridSize(
  raw: unknown,
  fallback: z.infer<typeof GridSizeSchema> = { w: 1, h: 1 },
): z.infer<typeof GridSizeSchema> {
  // Already an object (e.g. from JSON.parse of an API response)
  if (raw != null && typeof raw === "object") {
    const result = GridSizeSchema.safeParse(raw);
    if (result.success) return result.data;
  }

  // JSON string from DB
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      const result = GridSizeSchema.safeParse(parsed);
      if (result.success) return result.data;
    } catch {
      // not valid JSON — fall through
    }
  }

  return fallback;
}

/**
 * Format a zod error into a single user-friendly string.
 * Groups issues by path so the output reads like a bulleted list.
 */
export function formatSchemaError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}
