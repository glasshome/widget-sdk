// Core widget API

export { defineWidget } from "./define-widget";
// Home Assistant data & service hooks (host-provided sync-layer instance)
export * from "./data";
// Framework (widget composition API)
// Re-exports framework components, hooks, design tokens, theming, and types
export * from "./framework";
// Shared chart helpers
export { monotoneCubicPath } from "./shared/spline";
// Runtime validation schemas (legacy re-exports; prefer "@glasshome/widget-sdk/schemas")
export { formatSchemaError, WidgetManifestSchema } from "./schemas";
// Theme utilities (framework-agnostic)
export { isDark } from "./theme";
// v1.0 Types (original SDK API)
export type {
  GridSize,
  WidgetContext,
  WidgetDefinition,
  WidgetManifest,
} from "./types";
// Version constant
export { SDK_VERSION } from "./version";
