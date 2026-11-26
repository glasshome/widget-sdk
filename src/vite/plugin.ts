import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, ViteDevServer } from "vite";
import { buildWidgets } from "./build";
import {
  guestSurfaceGuard,
  isWidgetExternal,
  syncLayerImportGuard,
  uiImportGuard,
} from "./import-guards";
import { normalizePath } from "./normalize-path";
import { checkBuiltWidget } from "./schema-guard";
import {
  buildOnlyTailwind,
  createWidgetBuildEntry,
  readSdkRange,
  widgetCssConfig,
} from "./tailwind-entry";

export interface GlasshomeWidgetOptions {
  /** Entry file for the widget (default: "src/index.tsx") */
  entry?: string;
}

const VIRTUAL_WIDGET_ID = "virtual:glasshome-widget";
const RESOLVED_VIRTUAL_WIDGET_ID = "\0virtual:glasshome-widget";
const PREVIEW_ROUTE_ID = "/@glasshome/preview";

function getPreviewDir(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // dist/vite/ sits two levels below preview/
  return resolve(dirname(thisFile), "../../preview");
}

/**
 * Vite plugin for GlassHome widget development and building.
 *
 * Returns an array of plugins:
 * - Build mode: configures library build with proper externals
 * - Dev mode: serves a preview host with dark mode toggle and manifest display
 */
export function glasshomeWidget(options?: GlasshomeWidgetOptions): Plugin[] {
  const entry = options?.entry ?? "src/index.tsx";

  const buildPlugin: Plugin = {
    name: "glasshome-widget:build",
    apply: "build",
    config() {
      const root = process.cwd();
      return {
        css: widgetCssConfig(),
        build: {
          lib: {
            // A single-widget project: its entry's folder is the whole source tree.
            entry: createWidgetBuildEntry(
              root,
              "index",
              resolve(root, entry),
              dirname(resolve(root, entry)),
              resolve(root, "manifest.json"),
            ),
            formats: ["es"] as const,
            fileName: "index",
            cssFileName: "index",
          },
          rollupOptions: {
            external: isWidgetExternal,
          },
        },
      };
    },
  };

  const devPlugin: Plugin = {
    name: "glasshome-widget:dev",
    apply: "serve",
    enforce: "pre",

    config() {
      const previewDir = getPreviewDir();
      const projectRoot = process.cwd();
      const workspaceRoot = resolve(projectRoot, "..", "..");
      return {
        server: {
          fs: {
            allow: [previewDir, projectRoot, workspaceRoot],
          },
        },
      };
    },

    configureServer(server: ViteDevServer) {
      const previewDir = getPreviewDir();
      const htmlPath = join(previewDir, "preview.html");

      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/" || req.url === "/index.html") {
          try {
            let html = readFileSync(htmlPath, "utf-8");
            html = await server.transformIndexHtml(req.url, html);
            res.setHeader("Content-Type", "text/html");
            res.statusCode = 200;
            res.end(html);
          } catch (e) {
            next(e);
          }
        } else {
          next();
        }
      });
    },

    resolveId(id: string) {
      if (id === PREVIEW_ROUTE_ID) {
        const previewDir = getPreviewDir();
        return normalizePath(join(previewDir, "host.tsx"));
      }
      if (id === VIRTUAL_WIDGET_ID) {
        return RESOLVED_VIRTUAL_WIDGET_ID;
      }
      return undefined;
    },

    load(id: string) {
      if (id === RESOLVED_VIRTUAL_WIDGET_ID) {
        const absEntry = normalizePath(resolve(process.cwd(), entry));
        return `export { default } from "${absEntry}";`;
      }
      return undefined;
    },
  };

  const schemaPlugin: Plugin = {
    name: "glasshome-widget:schema",
    apply: "build",
    async closeBundle() {
      await checkBuiltWidget({
        outDir: resolve(process.cwd(), "dist"),
        name: "index",
        hashFile: resolve(process.cwd(), ".schema-hash"),
        manifestPath: resolve(process.cwd(), "manifest.json"),
      });
    },
  };

  return [
    ...buildOnlyTailwind(),
    buildPlugin,
    syncLayerImportGuard(),
    uiImportGuard(undefined, readSdkRange(resolve(process.cwd(), "manifest.json"))),
    guestSurfaceGuard(),
    schemaPlugin,
    devPlugin,
  ];
}

// ---------------------------------------------------------------------------
// Multi-widget plugin (glasshomeWidgets)
// ---------------------------------------------------------------------------

export interface GlasshomeWidgetsOptions {
  /** Directory containing widget subdirectories (default: "src") */
  srcDir?: string;
  /** Output directory for built bundles and registry (default: "dist") */
  outDir?: string;
}

/**
 * Vite plugin for multi-widget projects.
 *
 * In build mode, delegates to `buildWidgets()` which runs a separate Vite
 * build per widget so shared code is inlined (no chunk splitting).
 * The plugin's `config()` returns a minimal build config to suppress Vite's
 * default build, and `closeBundle()` runs the actual per-widget builds.
 */
export function glasshomeWidgets(options?: GlasshomeWidgetsOptions): Plugin[] {
  const srcDirName = options?.srcDir ?? "src";
  const outDirName = options?.outDir ?? "dist";
  let callerPlugins: Plugin[] = [];

  const buildPlugin: Plugin = {
    name: "glasshome-widgets:build",
    apply: "build",
    config(config) {
      // Capture caller-provided plugins (e.g. solid()) so we can pass them
      // to each per-widget build. Filter out our own plugins to avoid recursion.
      callerPlugins = ((config.plugins ?? []).flat().filter(Boolean) as Plugin[]).filter(
        (p) => !p.name?.startsWith("glasshome-widgets:"),
      );

      // Return a minimal config, the real builds happen in closeBundle
      return {
        build: {
          rollupOptions: {
            input: { __glasshome_noop: "\0glasshome-noop" },
          },
          outDir: outDirName,
          copyPublicDir: false,
        },
      };
    },

    resolveId(id) {
      if (id === "\0glasshome-noop") return id;
    },

    load(id) {
      if (id === "\0glasshome-noop") return "export {}";
    },

    async closeBundle() {
      await buildWidgets({
        srcDir: srcDirName,
        outDir: outDirName,
        plugins: callerPlugins,
      });
    },
  };

  return [buildPlugin];
}
