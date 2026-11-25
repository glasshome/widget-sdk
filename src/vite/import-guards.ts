import { relative } from "node:path";
import { isHostProvidedModule } from "@glasshome/widget-contract";
import type { Plugin } from "vite";
import { deprecations, formatDeprecation } from "../deprecations";
import { normalizePath } from "./normalize-path";

/**
 * Packages provided by the host import map; widgets must not bundle these.
 * Delegates to the shared list in @glasshome/widget-contract so the host's
 * import map and the widget build can never disagree again. Exact match only:
 * a specifier the import map does not serve (e.g. "@glasshome/ui/tokens")
 * must be bundled, because leaving it external is a runtime 404.
 */
export function isWidgetExternal(id: string): boolean {
  return isHostProvidedModule(id);
}

const WIDGET_SOURCE_RE = /\.(ts|tsx|js|jsx)$/;

const SYNC_LAYER_IMPORT_RE = /from\s+["']@glasshome\/sync-layer(\/[^"']*)?["']/;

/**
 * True when a widget source file imports `@glasshome/sync-layer` directly.
 * Same file filters as `isDirectUiImportSource`: node_modules is the SDK's own
 * business, and non-script assets are not scanned.
 */
export function isDirectSyncLayerImportSource(id: string, code: string): boolean {
  const file = normalizePath(id).split("?")[0] ?? "";
  if (file.includes("/node_modules/")) return false;
  if (!WIDGET_SOURCE_RE.test(file)) return false;
  return SYNC_LAYER_IMPORT_RE.test(code);
}

/**
 * Fails the build when a widget imports @glasshome/sync-layer directly.
 * The single store instance lives in the host; bundling a second copy would
 * silently disconnect the widget from live state. Widgets must use the
 * hooks re-exported by @glasshome/widget-sdk (capability-routed by the host).
 *
 * Detection is a `transform` source scan, not `resolveId`. Rollup consults
 * `rollupOptions.external` before plugin `resolveId` hooks, so an externalized
 * specifier never reaches them: under Vite 8 this guard threw on nothing at all
 * and a seeded direct import built clean. A hard-error contract enforcing
 * nothing is worse than no contract, because the green build is read as proof.
 */
export function syncLayerImportGuard(): Plugin {
  return {
    name: "glasshome-widget:sync-layer-guard",
    apply: "build",
    enforce: "pre",
    transform(code: string, id: string) {
      if (isDirectSyncLayerImportSource(id, code)) {
        throw new Error(
          `Widgets must not import "@glasshome/sync-layer" directly ` +
            `(imported by ${normalizePath(relative(process.cwd(), id.split("?")[0] ?? id))}). ` +
            `Import the equivalent hook from "@glasshome/widget-sdk" instead ` +
            `(e.g. useEntity, useEntities, useService).`,
        );
      }
      return null;
    },
  };
}

/**
 * True when a widget source file imports `@glasshome/ui` directly. The regex is
 * the registry's `sourcePattern` for `direct-ui-import`, so the build warning and
 * the widget-cli lint can never disagree on what counts as a direct import.
 * node_modules is excluded: dependencies and the SDK's own generated entries in
 * BUILD_CACHE_DIR (the theme `@import`) are the SDK's business, not the widget's.
 */
export function isDirectUiImportSource(id: string, code: string): boolean {
  const file = normalizePath(id).split("?")[0] ?? "";
  if (file.includes("/node_modules/")) return false;
  if (!WIDGET_SOURCE_RE.test(file)) return false;
  const entry = deprecations.find((d) => d.id === "direct-ui-import");
  if (!entry?.sourcePattern) return false;
  return new RegExp(entry.sourcePattern).test(code);
}

/**
 * Warns (never fails) when widget source imports @glasshome/ui directly.
 * Warn-only counterpart to syncLayerImportGuard: direct imports keep working
 * until 2.0, but they bypass the sdkVersion gate, so ui can drift against
 * published widgets with nothing checking compatibility. Detection scans
 * module source in `transform` because externalized specifiers never reach
 * `resolveId` (rollup consults `external` for the bare id first).
 *
 * `warned` carries the files already reported across every build in one run, so
 * a module shared by N widgets is named once and not once per bundle it lands in.
 */
export function createUiImportTracker(warned: Set<string> = new Set()) {
  const offenders = new Set<string>();
  return {
    scan(id: string, code: string): void {
      if (isDirectUiImportSource(id, code)) {
        offenders.add(normalizePath(relative(process.cwd(), id.split("?")[0] ?? id)));
      }
    },
    /** Offending files this run has not reported yet; marks them reported. */
    take(): string[] {
      const fresh = [...offenders].filter((f) => !warned.has(f));
      for (const f of fresh) warned.add(f);
      return fresh;
    },
  };
}

export function uiImportGuard(warned?: Set<string>): Plugin {
  const tracker = createUiImportTracker(warned);
  return {
    name: "glasshome-widget:ui-import-guard",
    apply: "build",
    enforce: "pre",
    transform(code: string, id: string) {
      tracker.scan(id, code);
      return null;
    },
    buildEnd() {
      const fresh = tracker.take();
      if (fresh.length === 0) return;
      const entry = deprecations.find((d) => d.id === "direct-ui-import");
      const notice = entry
        ? formatDeprecation(entry)
        : '[@glasshome/widget-sdk] Direct @glasshome/ui imports are deprecated; import the same export from "@glasshome/widget-sdk".';
      const files = fresh.map((f) => `    ${f}`).join("\n");
      console.warn(`${notice}\n  Direct @glasshome/ui import(s) in:\n${files}`);
    },
  };
}
