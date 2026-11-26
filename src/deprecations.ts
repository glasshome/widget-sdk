/**
 * Deprecation registry: one entry per pattern with no runtime symbol, read by the
 * widget-cli source lint, the SDK build guard and the generated docs table.
 */

export interface DeprecationEntry {
  /** Stable identifier. Used for lint matching. */
  id: string;
  /** Version the symbol/pattern was deprecated in. */
  since: string;
  /** Version it is removed in. */
  removeIn: string;
  /** Human-readable replacement. */
  replacement: string;
  /** Public docs URL for the migration. */
  docsUrl: string;
  /** Regex source matched against widget files by the CLI lint. */
  sourcePattern?: string;
}

const DOCS_URL = "https://glasshome.app/docs/widget-sdk/config";

export const deprecations: readonly DeprecationEntry[] = [
  {
    // No wrappable runtime symbol: the host serves @glasshome/ui/solid through its
    // import map with no compat gate, so direct imports drift ungated across the Hub
    // auto-update boundary. The SDK re-exports the same primitives behind sdkVersion.
    id: "direct-ui-import",
    since: "1.9.0",
    removeIn: "2.0.0",
    replacement:
      'the same export from "@glasshome/widget-sdk" (keep @glasshome/ui installed: its styles stay in the build)',
    docsUrl: "https://glasshome.app/docs/widget-styling#importing-ui-components",
    sourcePattern: "from\\s+[\"']@glasshome/ui(/[^\"']*)?[\"']",
  },
  {
    // No wrappable runtime symbol: the <iconify-icon> element lives in the host
    // import map and only renders because dash points its API at /iconify/. 2.0
    // drops the import-map entry, that provider, and the element's CSP policy.
    id: "iconify-icon",
    since: "1.15.0",
    removeIn: "2.0.0",
    replacement: '<Icon icon="prefix:name" /> from "@glasshome/widget-sdk"',
    docsUrl: DOCS_URL,
    sourcePattern: "(?:from|import)\\s+[\"']@?iconify-icon(/solid)?[\"']",
  },
];

/** Format a registry entry into the one-line notice shared by every channel. */
export function formatDeprecation(d: DeprecationEntry): string {
  return `[@glasshome/widget-sdk] ${d.id} is deprecated since ${d.since}, removed in ${d.removeIn}. Use ${d.replacement}. See ${d.docsUrl}`;
}
