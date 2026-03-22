import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { InlineConfig, Plugin, ViteDevServer } from "vite";

export interface GlasshomeWidgetOptions {
  /** Entry file for the widget (default: "src/index.tsx") */
  entry?: string;
}

const VIRTUAL_WIDGET_ID = "virtual:glasshome-widget";
const RESOLVED_VIRTUAL_WIDGET_ID = "\0virtual:glasshome-widget";
const PREVIEW_ROUTE_ID = "/@glasshome/preview";

function normalizePath(p: string): string {
  return sep === "\\" ? p.split(sep).join("/") : p;
}

function getPreviewDir(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // From dist/vite/index.js → ../../preview/
  return resolve(dirname(thisFile), "../../preview");
}

// ---------------------------------------------------------------------------
// Shared externals
// ---------------------------------------------------------------------------

/** Packages provided by the host import map — widgets must not bundle these. */
export function isWidgetExternal(id: string): boolean {
  return (
    id === "solid-js" ||
    id.startsWith("solid-js/") ||
    id === "@glasshome/widget-sdk" ||
    id.startsWith("@glasshome/widget-sdk/") ||
    id === "@glasshome/ui" ||
    id.startsWith("@glasshome/ui/") ||
    id === "@glasshome/sync-layer" ||
    id.startsWith("@glasshome/sync-layer/")
  );
}

// ---------------------------------------------------------------------------
// Widget discovery & registry generation
// ---------------------------------------------------------------------------

interface DiscoveredWidget {
  name: string;
  entry: string;
}

/** Scan srcDir for subdirectories containing index.tsx + manifest.json. */
export function discoverWidgets(srcDir: string): DiscoveredWidget[] {
  const widgets: DiscoveredWidget[] = [];
  if (!existsSync(srcDir)) return widgets;

  for (const dir of readdirSync(srcDir)) {
    const dirPath = resolve(srcDir, dir);
    if (!statSync(dirPath).isDirectory()) continue;
    const entry = resolve(dirPath, "index.tsx");
    const manifest = resolve(dirPath, "manifest.json");
    if (existsSync(entry) && existsSync(manifest)) {
      widgets.push({ name: dir, entry });
    }
  }
  return widgets;
}

/** Generate registry.json from widget manifests. */
export function generateRegistry(srcDir: string, outDir: string): void {
  const widgets: unknown[] = [];

  if (existsSync(srcDir)) {
    for (const dir of readdirSync(srcDir)) {
      if (!statSync(join(srcDir, dir)).isDirectory()) continue;
      const manifestPath = join(srcDir, dir, "manifest.json");
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        widgets.push({ ...manifest, bundleUrl: `./${dir}.js` });
      } catch {
        // skip dirs without manifest
      }
    }
  }

  const registry = {
    version: 1,
    generatedAt: new Date().toISOString(),
    baseUrl: "./",
    widgets,
  };

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  writeFileSync(join(outDir, "registry.json"), JSON.stringify(registry, null, 2));
  console.log(`[registry] Generated registry.json with ${widgets.length} widget(s)`);
}

// ---------------------------------------------------------------------------
// Per-widget build (Vite JS API)
// ---------------------------------------------------------------------------

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

  // Build each widget independently
  for (const widget of widgets) {
    await build({
      configFile: false,
      root,
      plugins: options?.plugins ?? [],
      ...options?.viteConfig,
      build: {
        lib: {
          entry: widget.entry,
          formats: ["es"],
          fileName: widget.name,
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
  }

  // Generate registry
  generateRegistry(srcDir, outDir);
}

// ---------------------------------------------------------------------------
// Single-widget plugin (glasshomeWidget)
// ---------------------------------------------------------------------------

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
      return {
        build: {
          lib: {
            entry,
            formats: ["es"] as const,
            fileName: "index",
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

  return [buildPlugin, devPlugin];
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

      // Return a minimal config — the real builds happen in closeBundle
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
