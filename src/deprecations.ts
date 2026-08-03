/**
 * Reusable deprecation mechanism: one registry drives all three channels
 * (runtime warn-once, JSDoc `@deprecated`, and the widget-cli source lint) plus the
 * generated docs table. Every future deprecation is one registry entry + one
 * `deprecate()` wrapper call, giving widget developers a timed window to migrate.
 */

export interface DeprecationEntry {
  /** Stable identifier, e.g. `widgetFields.title`. Used for warn-once and lint matching. */
  id: string;
  /** Version the symbol/pattern was deprecated in. */
  since: string;
  /** Version it is removed in. */
  removeIn: string;
  /** Human-readable replacement, e.g. `field.title()`. */
  replacement: string;
  /** Public docs URL for the migration. */
  docsUrl: string;
  /**
   * Regex source matched against widget files by the CLI lint. Present for patterns
   * with no wrappable runtime symbol (e.g. the raw-zod config pattern).
   */
  sourcePattern?: string;
}

const DOCS_URL = "https://glasshome.app/docs/widget-sdk/config";

export const deprecations: readonly DeprecationEntry[] = [
  {
    id: "widgetFields.title",
    since: "1.4.0",
    removeIn: "2.0.0",
    replacement: "field.title()",
    docsUrl: DOCS_URL,
    sourcePattern: "widgetFields\\.title\\b",
  },
  {
    id: "widgetFields.entityIds",
    since: "1.4.0",
    removeIn: "2.0.0",
    replacement: "field.entities(domain, options?)",
    docsUrl: DOCS_URL,
    sourcePattern: "widgetFields\\.entityIds\\b",
  },
  {
    id: "widgetFields.singleEntity",
    since: "1.4.0",
    removeIn: "2.0.0",
    replacement: "field.entity(domain, options?)",
    docsUrl: DOCS_URL,
    sourcePattern: "widgetFields\\.singleEntity\\b",
  },
  {
    id: "widgetFields.areaId",
    since: "1.4.0",
    removeIn: "2.0.0",
    replacement: "field.area()",
    docsUrl: DOCS_URL,
    sourcePattern: "widgetFields\\.areaId\\b",
  },
  {
    // No wrappable runtime symbol: the host used to infer an area picker from the
    // property name alone, so a raw `areaId` string field got one by accident and
    // any other name silently rendered a text input.
    id: "area-by-field-name",
    since: "1.8.0",
    removeIn: "2.0.0",
    replacement: "field.area()",
    docsUrl: DOCS_URL,
    sourcePattern: "\\bareaId\\s*:\\s*z\\.string\\(",
  },
  {
    // The stub context outside <Widget> returns (0,0) forever; three widgets
    // shipped frozen in their smallest scene before a user noticed.
    id: "ctx.dimensions",
    since: "1.9.0",
    removeIn: "2.0.0",
    replacement: "useWidgetDimensions()",
    docsUrl: "https://glasshome.app/docs/widget-api-reference",
    sourcePattern: "\\.dimensions\\(\\)",
  },
  {
    // No wrappable runtime symbol: the host serves @glasshome/ui/solid through its
    // import map with no compat gate, so direct imports drift ungated across the Hub
    // auto-update boundary. The SDK re-exports the same primitives behind sdkVersion.
    id: "direct-ui-import",
    since: "1.9.0",
    removeIn: "2.0.0",
    replacement: 'the same export from "@glasshome/widget-sdk"',
    docsUrl: "https://glasshome.app/docs/widget-styling",
    sourcePattern: "from\\s+[\"']@glasshome/ui(/[^\"']*)?[\"']",
  },
  {
    // No wrappable runtime symbol: `z` stays a permanent escape hatch, so this is
    // flagged only when `z.object(...)` is used to build a widget's configSchema.
    id: "raw-zod-config",
    since: "1.4.0",
    removeIn: "2.0.0",
    replacement: "defineConfig({ ... })",
    docsUrl: DOCS_URL,
    sourcePattern: "configSchema\\s*=\\s*z\\.object\\(",
  },
];

/** Format a registry entry into the one-line notice shared by every channel. */
export function formatDeprecation(d: DeprecationEntry): string {
  return `[@glasshome/widget-sdk] ${d.id} is deprecated since ${d.since}, removed in ${d.removeIn}. Use ${d.replacement}. See ${d.docsUrl}`;
}

const warned = new Set<string>();

/** Reset warn-once state. Test-only. */
export function _resetDeprecationWarnings(): void {
  warned.clear();
}

function isDev(): boolean {
  // Bundlers inline process.env.NODE_ENV; guard for runtimes without `process`.
  return typeof process !== "undefined" && process.env?.NODE_ENV !== "production";
}

/**
 * Wrap a deprecated export. On its first call in a dev build, emits a `console.warn`
 * once per id (formatted from the registry); production builds are silent and add no
 * overhead beyond a Set lookup. The wrapped function's signature is preserved.
 */
export function deprecate<A extends unknown[], R>(fn: (...args: A) => R, id: string): (...args: A) => R {
  return (...args: A): R => {
    if (isDev() && !warned.has(id)) {
      warned.add(id);
      const entry = deprecations.find((d) => d.id === id);
      if (entry) console.warn(formatDeprecation(entry));
    }
    return fn(...args);
  };
}
