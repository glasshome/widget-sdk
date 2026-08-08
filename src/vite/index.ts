import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatSchemaError,
  isHostProvidedModule,
  widgetManifestSchema,
} from "@glasshome/widget-contract";
import tailwindcss from "@tailwindcss/vite";
import type { InlineConfig, Plugin, ViteDevServer } from "vite";
import { deprecations, formatDeprecation } from "../deprecations";

export interface GlasshomeWidgetOptions {
  /** Entry file for the widget (default: "src/index.tsx") */
  entry?: string;
}

// ---------------------------------------------------------------------------
// Schema hash utility
// ---------------------------------------------------------------------------

/**
 * Produces a stable 16-char hex hash of a JSON Schema object.
 * Used to detect shape changes between builds so we can warn when configVersion was not bumped.
 */
function hashSchema(jsonSchema: object): string {
  const stable = JSON.stringify(jsonSchema, Object.keys(jsonSchema).sort());
  return createHash("sha256").update(stable).digest("hex").slice(0, 16);
}

interface SchemaGuardRecord {
  hash: string;
  configVersion: number | null;
}

/**
 * Most previews anyone will look at, and the ceiling the hub renders to.
 *
 * Declaring more than this used to mean the extras were quietly not rendered:
 * the gallery looked complete and was not. Failing the build instead makes the
 * author decide which states matter rather than discovering the loss never.
 */
export const MAX_EXAMPLES = 20;

/**
 * Validate `examples` at build time.
 *
 * Runs before the `configSchema` early return, because a widget can declare
 * examples without a config schema and still deserves the check.
 */
async function assertExamplesValid(examples: unknown, widgetName: string): Promise<void> {
  if (examples === undefined) return;

  let z: typeof import("zod").z;
  try {
    ({ z } = await import("zod"));
  } catch {
    return;
  }

  const tile = z.number().int().positive();
  const schema = z
    .array(
      z.object({
        config: z.record(z.string(), z.unknown()),
        size: z.object({ w: tile, h: tile }),
        label: z.string().optional(),
      }),
    )
    .max(MAX_EXAMPLES);

  const result = schema.safeParse(examples);
  if (result.success) return;

  const detail = result.error.issues
    .map((issue) => {
      const at = issue.path.length ? `[${issue.path.join("][")}]` : "";
      return `  examples${at}: ${issue.message}`;
    })
    .join("\n");
  throw new Error(
    `[widget-sdk] Invalid \`examples\` for "${widgetName}":\n${detail}\n` +
      `Each example needs a \`config\` object and a \`size\` of whole positive tiles, ` +
      `and at most ${MAX_EXAMPLES} are rendered.`,
  );
}

interface ExampleConfigIssue {
  index: number;
  label?: string;
  problems: string[];
}

/**
 * Fail the build when an example's config does not satisfy the widget's own
 * `configSchema`. The parse happens in the introspection subprocess, which is
 * where the live schema is; this only turns its findings into an error.
 *
 * Worth failing on: such an example renders a broken or empty widget, and the
 * preview publishes anyway, so the storefront shows a picture of the widget not
 * working. A wrong preview is worse than no preview.
 */
function assertExampleConfigsValid(
  issues: ExampleConfigIssue[] | undefined,
  widgetName: string,
): void {
  if (!issues?.length) return;

  const detail = issues
    .map((issue) => {
      const name = issue.label ? `"${issue.label}"` : `#${issue.index}`;
      return [`  examples[${issue.index}] ${name}:`, ...issue.problems.map((p) => `    ${p}`)].join(
        "\n",
      );
    })
    .join("\n");
  throw new Error(
    `[widget-sdk] Example config rejected by "${widgetName}"'s own configSchema:\n${detail}\n` +
      "Each example's `config` must be a config the widget would actually accept, " +
      "or its preview renders empty.",
  );
}

interface WidgetIntrospection {
  manifest:
    | ({ name?: string; configVersion?: number; examples?: unknown } & Record<string, unknown>)
    | null;
  jsonSchema: object | null;
  exampleConfigIssues?: ExampleConfigIssue[];
}

type IntrospectResult =
  | { ok: true; value: WidgetIntrospection }
  | { ok: false; reason: string };

/**
 * Read a built bundle's definition, in a subprocess.
 *
 * A widget bundle cannot be imported by the build process: `solid-js/web`
 * resolves to its server build under Node's conditions and throws the moment
 * the module initialises, and browser conditions then need a DOM for the
 * templates Solid creates at import time. So this spawns the runtime again
 * with `--conditions browser`, where introspect.js installs a DOM first.
 */
function introspect(outFile: string): IntrospectResult {
  // .js when running from dist, .ts when running from source (tests), so the
  // tests exercise the same subprocess the build uses rather than a stand-in.
  const here = dirname(fileURLToPath(import.meta.url));
  const probe = [join(here, "introspect.js"), join(here, "introspect.ts")].find((p) =>
    existsSync(p),
  );
  if (!probe) return { ok: false, reason: `introspect not found next to ${here}` };

  const run = spawnSync(process.execPath, ["--conditions", "browser", probe, outFile], {
    encoding: "utf-8",
    // A widget that loops at import time must not hang the build.
    timeout: 30_000,
  });

  if (run.error) return { ok: false, reason: run.error.message };
  if (run.status !== 0) {
    const detail = (run.stderr || "").trim().split("\n")[0] || `exit ${run.status}`;
    return { ok: false, reason: detail };
  }
  try {
    return { ok: true, value: JSON.parse(run.stdout) as WidgetIntrospection };
  } catch {
    return { ok: false, reason: "introspect returned unparseable output" };
  }
}

/**
 * Configuration-drift guard (D-11). Reads the built bundle, derives the JSON
 * Schema from its configSchema, and compares against the recorded
 * `.schema-hash`. A shape change without a configVersion bump fails the build:
 * tsc cannot catch this class of break because the old persisted config still
 * parses, only its meaning shifts. Legacy plain-hash records (written by
 * pre-1.7 builds) cannot prove a missing bump, so they only warn, then upgrade
 * to the JSON record format.
 *
 * When `manifestPath` is given, the build also writes the generated manifest
 * (see writeGeneratedManifest).
 */
/**
 * Facts only the bundle knows, so only these are written to disk.
 *
 * The inverse list (everything the file already holds) stays authoritative on
 * purpose. `sdkVersion` is the case that proves it: the disk value is the one
 * that ships and is gated twice, while the value inside `defineWidget` has
 * drifted to a stale range in 17 of 19 official widgets. Generating from the
 * bundle would publish the dead one. `defaultSize` and `capabilities` are
 * similar: they exist only on disk today, so a bundle-wins merge would delete
 * them.
 *
 * So phase 1 is strictly additive. Authors migrate a field by moving it into
 * `defineWidget` and deleting it from the file; until then the file wins.
 */
const BUNDLE_OWNED_MANIFEST_KEYS = [
  "schema",
  "defaultConfig",
  "examples",
  "configVersion",
] as const;

/**
 * Write the manifest the publish pipeline reads.
 *
 * Adds the facts that only exist inside the bundle (the derived config schema,
 * its defaults, the examples, the config generation) to the file the author
 * already maintains. Nothing the file declares is touched, so this cannot lose
 * data and cannot change what an existing widget publishes.
 *
 * Skipped when the result is byte-identical, so a no-op build leaves a clean
 * tree.
 */
function writeGeneratedManifest(
  manifestPath: string,
  def: WidgetIntrospection,
  jsonSchema: object,
): void {
  const current = readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(current);
  const fromBundle: Record<string, unknown> = { ...(def.manifest ?? {}), schema: jsonSchema };

  for (const key of BUNDLE_OWNED_MANIFEST_KEYS) {
    if (fromBundle[key] !== undefined) manifest[key] = fromBundle[key];
  }

  const next = `${JSON.stringify(manifest, null, 2)}\n`;
  if (next !== current) writeFileSync(manifestPath, next);
}

export async function runSchemaGuard(args: {
  outFile: string;
  hashFile: string;
  widgetName: string;
  manifestPath?: string;
}): Promise<void> {
  if (!existsSync(args.outFile)) return;

  const read = introspect(args.outFile);
  if (!read.ok) {
    // Fatal on purpose. This was a silent `return` for months, then a warning.
    // A warning is still wrong: the build stays green while the examples and
    // config schema go unvalidated, and publish reads what this step produces,
    // so the same failure ships an unchecked widget on the irreversible step.
    throw new Error(
      `[widget-sdk] Could not read "${args.widgetName}" to check it: ${read.reason}\n` +
        "  Its examples and config schema could not be validated, so the build cannot continue.\n" +
        "  This usually means the bundle throws while being imported.",
    );
  }

  const def = read.value;
  const declaredName = def.manifest?.name ?? args.widgetName;
  // Shape first: a malformed entry would otherwise be reported as a schema
  // rejection, which points the author at the wrong thing.
  await assertExamplesValid(def.manifest?.examples, declaredName);
  assertExampleConfigsValid(def.exampleConfigIssues, declaredName);

  const jsonSchema = def.jsonSchema;
  if (!jsonSchema) return;

  if (args.manifestPath && existsSync(args.manifestPath)) {
    writeGeneratedManifest(args.manifestPath, def, jsonSchema);
  }

  const hash = hashSchema(jsonSchema);
  const configVersion = def.manifest?.configVersion ?? null;
  const widgetName = def.manifest?.name ?? args.widgetName;

  if (existsSync(args.hashFile)) {
    const raw = readFileSync(args.hashFile, "utf-8").trim();
    let recorded: SchemaGuardRecord | null = null;
    if (raw.startsWith("{")) {
      try {
        recorded = JSON.parse(raw) as SchemaGuardRecord;
      } catch {
        recorded = null;
      }
    }
    if (recorded) {
      if (recorded.hash !== hash && recorded.configVersion === configVersion) {
        throw new Error(
          `[widget-sdk] Config schema shape changed for "${widgetName}" without a configVersion bump. ` +
            `Bump configVersion in defineWidget (currently ${configVersion ?? "unset"}) or revert the schema change, ` +
            `then rebuild. Recorded in ${args.hashFile}`,
        );
      }
    } else if (raw !== hash) {
      console.warn(
        `[widget-sdk] Schema shape changed for "${widgetName}" — verify configVersion was bumped`,
      );
    }
  }

  writeFileSync(args.hashFile, `${JSON.stringify({ hash, configVersion })}\n`);
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

/**
 * Packages provided by the host import map — widgets must not bundle these.
 * Delegates to the shared list in @glasshome/widget-contract so the host's
 * import map and the widget build can never disagree again. Exact match only:
 * a specifier the import map does not serve (e.g. "@glasshome/ui/tokens")
 * must be bundled, because leaving it external is a runtime 404.
 */
export function isWidgetExternal(id: string): boolean {
  return isHostProvidedModule(id);
}

/**
 * Fails the build when a widget imports @glasshome/sync-layer directly.
 * The single store instance lives in the host; bundling a second copy would
 * silently disconnect the widget from live state. Widgets must use the
 * hooks re-exported by @glasshome/widget-sdk (capability-routed by the host).
 */
function syncLayerImportGuard(): Plugin {
  return {
    name: "glasshome-widget:sync-layer-guard",
    apply: "build",
    enforce: "pre",
    resolveId(id: string, importer?: string) {
      if (id === "@glasshome/sync-layer" || id.startsWith("@glasshome/sync-layer/")) {
        throw new Error(
          `Widgets must not import "${id}" directly` +
            (importer ? ` (imported by ${importer})` : "") +
            `. Import the equivalent hook from "@glasshome/widget-sdk" instead ` +
            `(e.g. useEntity, useEntities, useService).`,
        );
      }
      return undefined;
    },
  };
}

const WIDGET_SOURCE_RE = /\.(ts|tsx|js|jsx)$/;

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
 * `resolveId` (rollup consults `external` for the bare id first). One warning
 * per widget build, listing the offending files and the SDK replacement.
 */
function uiImportGuard(): Plugin {
  const offenders = new Set<string>();
  return {
    name: "glasshome-widget:ui-import-guard",
    apply: "build",
    enforce: "pre",
    transform(code: string, id: string) {
      if (isDirectUiImportSource(id, code)) {
        offenders.add(normalizePath(relative(process.cwd(), id.split("?")[0] ?? id)));
      }
      return null;
    },
    buildEnd() {
      if (offenders.size === 0) return;
      const entry = deprecations.find((d) => d.id === "direct-ui-import");
      const notice = entry
        ? formatDeprecation(entry)
        : '[@glasshome/widget-sdk] Direct @glasshome/ui imports are deprecated; import the same export from "@glasshome/widget-sdk".';
      const files = [...offenders].map((f) => `    ${f}`).join("\n");
      console.warn(`${notice}\n  Direct @glasshome/ui import(s) in:\n${files}`);
    },
  };
}

// ---------------------------------------------------------------------------
// Per-widget Tailwind entry
// ---------------------------------------------------------------------------

const BUILD_CACHE_DIR = "node_modules/.cache/glasshome-widgets";

/** Resolve an exported subpath to its on-disk file; null when not installed. */
function resolveExported(specifier: string): string | null {
  try {
    const require = createRequire(join(process.cwd(), "package.json"));
    return require.resolve(specifier);
  } catch {
    return null;
  }
}

// Theme variables (these and the household's runtime overrides) inherit into a
// widget's shadow root from the document — that is HOW theming reaches widgets.
// Defining them on :host inside the widget CSS freezes them at build-time
// values and overrides the inherited (themed) value, so widgets stop reacting
// to the theme. Only utility class *rules* and the SDK's own :host tokens
// belong in widget CSS; document theme variables must be left to inherit.
const FORBIDDEN_HOST_THEME_VARS = [
  "--radius",
  "--background",
  "--foreground",
  "--card",
  "--primary",
  "--border",
  "--muted",
  "--accent",
];

function assertNoHostThemeVars(outDir: string, name: string): void {
  const cssFile = join(outDir, `${name}.css`);
  if (!existsSync(cssFile)) return;
  const css = readFileSync(cssFile, "utf-8");
  // Theme vars under :root are inert in a shadow root (harmless); only :host
  // definitions override inheritance.
  for (const match of css.matchAll(/:host[^{]*\{([^}]*)\}/g)) {
    const body = match[1] ?? "";
    const offender = FORBIDDEN_HOST_THEME_VARS.find((v) => body.includes(`${v}:`));
    if (offender) {
      throw new Error(
        `[glasshome-widget] "${name}.css" defines theme variable "${offender}" on :host. ` +
          `Theme variables must inherit from the document so widgets follow the household ` +
          `theme — never re-scope them into the widget's shadow root.`,
      );
    }
  }
}

/**
 * Widgets render inside a closed shadow root in the host, which cuts them off
 * from the host document stylesheet. Every widget bundle must therefore carry
 * its own complete CSS: the ui theme + component styles, the SDK shell
 * classes, and the Tailwind utilities its own JSX uses. This writes a
 * generated css entry (a Tailwind pass over exactly those sources) plus a
 * wrapper module that imports it ahead of the real widget entry, so Vite lib
 * mode emits it as the widget's `<name>.css`.
 *
 * `source(none)` disables Tailwind's automatic project-root scan — without it
 * every widget in a multi-widget repo gets the superset of all widgets'
 * classes. The dark variant is redefined shadow-aware: `.dark *` cannot match
 * across a shadow boundary, so the host mirrors the document's `dark` class
 * onto the shadow host element and `:host(.dark)` picks it up.
 */
function createWidgetBuildEntry(root: string, name: string, widgetEntry: string): string {
  const cacheDir = resolve(root, BUILD_CACHE_DIR);
  mkdirSync(cacheDir, { recursive: true });

  // "@glasshome/ui/styles" resolves to src/styles/globals.css, so the package
  // root is two levels up; "tailwind-sources" sits at the SDK package root.
  const uiStyles = resolveExported("@glasshome/ui/styles");
  if (!uiStyles) {
    throw new Error(
      "[widget-sdk] @glasshome/ui is required to build widgets (it provides the theme " +
        "every GlassHome widget ships with). Add it to your widget's dependencies.",
    );
  }
  const uiDir = resolve(dirname(uiStyles), "../..");
  const sdkSources = resolveExported("@glasshome/widget-sdk/tailwind-sources");
  const sdkDir = sdkSources ? dirname(sdkSources) : null;

  const scanDirs = [
    join(uiDir, "src"),
    join(uiDir, "dist"),
    ...(sdkDir ? [join(sdkDir, "src"), join(sdkDir, "dist")] : []),
    dirname(widgetEntry),
  ].filter((dir) => existsSync(dir));

  const cssPath = resolve(cacheDir, `${name}.tailwind.css`);
  writeFileSync(
    cssPath,
    [
      `@import "tailwindcss" source(none);`,
      `@import "tw-animate-css";`,
      `@import "@glasshome/ui/styles/theme";`,
      ...scanDirs.map((dir) => `@source "${normalizePath(dir)}";`),
      `@custom-variant dark {`,
      `  &:is(.dark *) { @slot }`,
      `  :host(.dark) & { @slot }`,
      `}`,
      "",
    ].join("\n"),
  );

  const entryPath = resolve(cacheDir, `${name}.entry.ts`);
  writeFileSync(
    entryPath,
    [
      `import "${normalizePath(cssPath)}";`,
      `export { default } from "${normalizePath(widgetEntry)}";`,
      "",
    ].join("\n"),
  );
  return entryPath;
}

/** Tailwind's vite plugin, constrained to build so dev-server setups that already run it don't double-process. */
function buildOnlyTailwind(): Plugin[] {
  const plugins = tailwindcss() as Plugin[];
  for (const p of plugins) {
    p.apply ??= "build";
  }
  return plugins;
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

/** Generate registry.json from widget manifests, validated against the contract schema. */
export function generateRegistry(srcDir: string, outDir: string): void {
  const widgets: unknown[] = [];

  if (existsSync(srcDir)) {
    for (const dir of readdirSync(srcDir)) {
      if (!statSync(join(srcDir, dir)).isDirectory()) continue;
      const manifestPath = join(srcDir, dir, "manifest.json");
      if (!existsSync(manifestPath)) continue;
      const parsed = widgetManifestSchema.safeParse(
        JSON.parse(readFileSync(manifestPath, "utf-8")),
      );
      if (!parsed.success) {
        throw new Error(
          `[registry] Invalid manifest for "${dir}": ${formatSchemaError(parsed.error)}`,
        );
      }
      const hasCss = existsSync(join(outDir, `${dir}.css`));
      widgets.push({
        ...parsed.data,
        bundleUrl: `./${dir}.js`,
        ...(hasCss ? { cssUrl: `./${dir}.css` } : {}),
      });
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
      plugins: [
        ...buildOnlyTailwind(),
        ...(options?.plugins ?? []),
        syncLayerImportGuard(),
        uiImportGuard(),
      ],
      ...options?.viteConfig,
      build: {
        lib: {
          entry: createWidgetBuildEntry(root, widget.name, widget.entry),
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
    assertNoHostThemeVars(outDir, widget.name);
    await runSchemaGuard({
      outFile: join(outDir, `${widget.name}.js`),
      hashFile: join(dirname(widget.entry), ".schema-hash"),
      widgetName: widget.name,
      manifestPath: join(dirname(widget.entry), "manifest.json"),
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
      const root = process.cwd();
      return {
        build: {
          lib: {
            entry: createWidgetBuildEntry(root, "index", resolve(root, entry)),
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
      assertNoHostThemeVars(resolve(process.cwd(), "dist"), "index");
      await runSchemaGuard({
        outFile: resolve(process.cwd(), "dist", "index.js"),
        hashFile: resolve(process.cwd(), ".schema-hash"),
        widgetName: "index",
        manifestPath: resolve(process.cwd(), "manifest.json"),
      });
    },
  };

  return [
    ...buildOnlyTailwind(),
    buildPlugin,
    syncLayerImportGuard(),
    uiImportGuard(),
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
