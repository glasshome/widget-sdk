// Core widget API

export type { Entity } from "./create-entity";
// SolidJS-specific utilities
export { createEntity } from "./create-entity";
export { defineWidget } from "./define-widget";
// Framework (widget composition API)
// Re-exports all framework components, hooks, design tokens, theming, variants, and types
export * from "./framework";
// Theme utilities (framework-agnostic)
export { getThemeToken, isDark } from "./theme";
// v1.0 Types (original SDK API)
export type {
  WidgetContext,
  WidgetDefinition,
  WidgetManifest,
  WidgetSize as LegacyWidgetSize,
  WidgetType,
} from "./types";
// Version constant
export { SDK_VERSION } from "./version";
