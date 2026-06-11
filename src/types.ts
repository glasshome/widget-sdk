import type { CapabilityGrant } from "@glasshome/widget-contract";
import type { ZodType } from "zod";

/**
 * Grid size constraint — number of columns (w) and rows (h).
 */
export interface GridSize {
  w: number;
  h: number;
}

/**
 * Widget manifest — declarative metadata about a widget.
 * Framework-agnostic: no SolidJS imports.
 */
export interface WidgetManifest {
  name: string;
  description?: string;
  minSize: GridSize;
  maxSize: GridSize;
  defaultSize?: GridSize;
  sdkVersion: string;
  icon?: string;
  schema?: object;                         // Backward compat; auto-populated by vite plugin from configSchema
  defaultConfig?: Record<string, unknown>; // Backward compat; replaced by Zod .default() values
  configVersion?: number;                  // Per D-11: integer, bumped on breaking config changes
  capabilities?: CapabilityGrant[];        // HA access the widget requests; enforced by the host
  cssUrl?: string;                         // Set by the build when the widget emits a CSS file
}

/**
 * Runtime context provided to widgets by the host.
 * Framework-agnostic: plain objects and functions.
 */
export interface WidgetContext {
  config: Record<string, unknown>;
  theme: {
    getToken: (name: string) => string;
    isDark: () => boolean;
  };
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * A complete widget definition combining manifest metadata with a component.
 * The component return type is `any` so the type contract does not force SolidJS
 * (internally the runtime knows it is SolidJS, but widget authors code against
 * a stable contract that does not leak framework internals).
 *
 * @template C - Widget configuration type
 */
export interface WidgetDefinition<C = Record<string, unknown>> {
  manifest: WidgetManifest;
  configSchema?: ZodType<C, unknown>;  // Per D-10: Zod schema as single source of truth
  migrate?: (config: Record<string, unknown>, fromConfigVersion: number) => Record<string, unknown>; // Per D-13: optional migration function
  component: (props: { config: C }) => any;
}
