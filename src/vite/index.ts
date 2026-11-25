import type { ExampleConfigIssue, WidgetIntrospection } from "./introspect-core";
import {
  createIntrospectSession,
  type IntrospectSession,
  type IntrospectSessionOptions,
  introspectOnce,
} from "./introspect-session";

export { createIntrospectSession, introspectOnce };
export type {
  ExampleConfigIssue,
  IntrospectSession,
  IntrospectSessionOptions,
  WidgetIntrospection,
};

export { type BuildWidgetsOptions, buildWidgets } from "./build";
export { discoverWidgets, generateRegistry } from "./discover";
export {
  createUiImportTracker,
  isDirectSyncLayerImportSource,
  isDirectUiImportSource,
  isWidgetExternal,
} from "./import-guards";
export {
  assertHookReadsDeclared,
  HOOK_READS,
  type Introspector,
  MAX_EXAMPLES,
  runSchemaGuard,
} from "./schema-guard";
export { dropSelfReferencingVars } from "./css-guard";
export {
  glasshomeWidget,
  type GlasshomeWidgetOptions,
  glasshomeWidgets,
  type GlasshomeWidgetsOptions,
} from "./plugin";
export { hostStylesUi, widgetProjectScanDirs, widgetTailwindEntry } from "./tailwind-entry";
