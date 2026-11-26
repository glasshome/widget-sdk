import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { InlineConfig, Plugin } from "vite";
import { discoverWidgets, generateRegistry } from "./discover";
import {
  guestSurfaceGuard,
  isWidgetExternal,
  syncLayerImportGuard,
  uiImportGuard,
} from "./import-guards";
import type { IntrospectSession } from "./introspect-session";
import { checkBuiltWidget } from "./schema-guard";
import {
  buildOnlyTailwind,
  createWidgetBuildEntry,
  readSdkRange,
  widgetCssConfig,
} from "./tailwind-entry";

export interface BuildWidgetsOptions {
  /** Directory containing widget subdirectories (default: "src") */
  srcDir?: string;
  /** Output directory for built bundles and registry (default: "dist") */
  outDir?: string;
  /** Additional Vite plugins to apply to each widget build (e.g. solid()) */
  plugins?: Plugin[];
  /** Extra Vite config merged into each widget build */
  viteConfig?: InlineConfig;
  /** Build only these widget names (subdirectory names). Skips full clean. */
  only?: string[];
  /** Persistent introspection worker to reuse across rebuilds. */
  session?: IntrospectSession;
}

/**
 * Build each widget as a separate Vite invocation so shared code is inlined
 * into each bundle (no chunk splitting).
 */
export async function buildWidgets(options?: BuildWidgetsOptions): Promise<void> {
  const { build } = await import("vite");

  const root = process.cwd();
  const srcDir = resolve(root, options?.srcDir ?? "src");
  const outDir = resolve(root, options?.outDir ?? "dist");

  let widgets = discoverWidgets(srcDir);
  if (widgets.length === 0) {
    console.warn("[glasshome-widgets] No widgets found in", srcDir);
    return;
  }

  if (options?.only) {
    const subset = new Set(options.only);
    widgets = widgets.filter((w) => subset.has(w.name));
  }

  // Full clean only when building everything; incremental keeps existing bundles
  if (!options?.only) {
    if (existsSync(outDir)) {
      rmSync(outDir, { recursive: true });
    }
  }
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  // Shared by every build below: a file that N widgets import is warned about once.
  const uiImportWarned = new Set<string>();

  // Build each widget independently
  for (const widget of widgets) {
    await build({
      configFile: false,
      root,
      plugins: [
        ...buildOnlyTailwind(),
        ...(options?.plugins ?? []),
        syncLayerImportGuard(),
        uiImportGuard(uiImportWarned, readSdkRange(join(dirname(widget.entry), "manifest.json"))),
        guestSurfaceGuard(),
      ],
      ...options?.viteConfig,
      css: { ...options?.viteConfig?.css, ...widgetCssConfig() },
      build: {
        lib: {
          entry: createWidgetBuildEntry(
            root,
            widget.name,
            widget.entry,
            srcDir,
            join(dirname(widget.entry), "manifest.json"),
          ),
          formats: ["es"],
          fileName: widget.name,
          // Widget CSS ships as a separate asset (adopted by the host's
          // shadow root), never inlined into the JS bundle.
          cssFileName: widget.name,
        },
        rollupOptions: {
          external: isWidgetExternal,
        },
        outDir,
        emptyOutDir: false,
        copyPublicDir: false,
        ...options?.viteConfig?.build,
      },
      logLevel: "warn",
    });
    await checkBuiltWidget({
      outDir,
      name: widget.name,
      hashFile: join(dirname(widget.entry), ".schema-hash"),
      manifestPath: join(dirname(widget.entry), "manifest.json"),
      session: options?.session,
    });
  }

  // Generate registry
  generateRegistry(srcDir, outDir);
}
