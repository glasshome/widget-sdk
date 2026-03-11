import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, ViteDevServer } from "vite";

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
            external: (id: string) =>
              id === "solid-js" ||
              id.startsWith("solid-js/") ||
              id === "@glasshome/widget-sdk" ||
              id.startsWith("@glasshome/widget-sdk/") ||
              id === "@glasshome/ui" ||
              id.startsWith("@glasshome/ui/"),
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
// Multi-widget project plugin
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
 * Scans `srcDir` for subdirectories containing `index.tsx`, builds each as a
 * separate ES entry, and generates `dist/registry.json` from each widget's
 * `manifest.json`.
 */
export function glasshomeWidgets(options?: GlasshomeWidgetsOptions): Plugin[] {
  const srcDirName = options?.srcDir ?? "src";
  const outDirName = options?.outDir ?? "dist";

  const buildPlugin: Plugin = {
    name: "glasshome-widgets:build",
    apply: "build",
    config() {
      const root = process.cwd();
      const srcDir = resolve(root, srcDirName);
      const input: Record<string, string> = {};

      if (existsSync(srcDir)) {
        for (const dir of readdirSync(srcDir)) {
          const entry = resolve(srcDir, dir, "index.tsx");
          if (statSync(resolve(srcDir, dir)).isDirectory() && existsSync(entry)) {
            input[dir] = entry;
          }
        }
      }

      return {
        build: {
          rollupOptions: {
            input,
            preserveEntrySignatures: "exports-only",
            external: (id: string) =>
              id === "solid-js" ||
              id.startsWith("solid-js/") ||
              id === "@glasshome/widget-sdk" ||
              id.startsWith("@glasshome/widget-sdk/") ||
              id === "@glasshome/ui" ||
              id.startsWith("@glasshome/ui/"),
            output: {
              dir: outDirName,
              format: "es" as const,
              entryFileNames: "[name].js",
            },
          },
        },
      };
    },
  };

  const registryPlugin: Plugin = {
    name: "glasshome-widgets:registry",
    apply: "build",
    closeBundle() {
      const root = process.cwd();
      const srcDir = resolve(root, srcDirName);
      const distDir = resolve(root, outDirName);
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

      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
      }
      writeFileSync(join(distDir, "registry.json"), JSON.stringify(registry, null, 2));
      console.log(`[registry] Generated registry.json with ${widgets.length} widget(s)`);
    },
  };

  return [buildPlugin, registryPlugin];
}
