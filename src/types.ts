export type WidgetType = "chart" | "status" | "control";
export type WidgetSize = "small" | "medium" | "large";

/**
 * Widget manifest — declarative metadata about a widget.
 * Framework-agnostic: no SolidJS imports.
 */
export interface WidgetManifest<T extends WidgetType = WidgetType> {
  tag: string;
  type: T;
  name: string;
  description?: string;
  size: WidgetSize;
  sdkVersion: string;
  icon?: string;
  schema?: object;
  defaultConfig?: Record<string, unknown>;
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
 * @template T - Widget type (chart, status, control)
 * @template C - Widget configuration type
 */
export interface WidgetDefinition<T extends WidgetType = WidgetType, C = Record<string, unknown>> {
  manifest: WidgetManifest<T>;
  component: (props: { config: C }) => any;
}
