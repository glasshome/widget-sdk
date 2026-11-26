import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import type { Features as LightningFeatures } from "lightningcss";
import { intersects, validRange } from "semver";
import type { Plugin } from "vite";
import { discoverWidgets } from "./discover";
import { normalizePath } from "./normalize-path";

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

/** The widget's own folder plus the project's shared folders: Tailwind only
 *  emits utilities for files it is pointed at, and a widget's shared component
 *  is as much its source as its entry. A sibling widget's folder stays out. */
export function widgetProjectScanDirs(srcDir: string, widgetEntry: string): string[] {
  const src = resolve(srcDir);
  const own = dirname(widgetEntry);
  const siblings = new Set(discoverWidgets(src).map((w) => dirname(w.entry)));
  const shared = readdirSync(src, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(src, e.name))
    .filter((dir) => !siblings.has(dir));
  return [own, ...shared];
}

const HOST_UI_SHEET_SDK = "1.24.0";

/** True when every host the range admits adopts ui's compiled CSS into each widget root, so the widget's sheet need not carry ui. */
export function hostStylesUi(sdkRange: string | undefined): boolean {
  if (!sdkRange || validRange(sdkRange) === null) return false;
  return !intersects(sdkRange, `<${HOST_UI_SHEET_SDK}`, { includePrerelease: true });
}

export function readSdkRange(manifestPath: string): string | undefined {
  if (!existsSync(manifestPath)) return undefined;
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, "utf-8"));
  if (typeof manifest !== "object" || manifest === null || !("sdkVersion" in manifest))
    return undefined;
  return typeof manifest.sdkVersion === "string" ? manifest.sdkVersion : undefined;
}

/** The Tailwind entry a widget's CSS compiles from: its own and the SDK's classes, plus all of ui while an older host it admits does not style ui itself. */
export function widgetTailwindEntry(scanDirs: string[], uiDir: string | null): string {
  const tailwind = uiDir
    ? [`@import "tailwindcss" source(none);`]
    : [
        `@layer theme, base, components, utilities;`,
        `@import "tailwindcss/theme.css" layer(theme);`,
        `@import "tailwindcss/utilities.css" layer(utilities) source(none);`,
      ];
  const sources = uiDir ? [join(uiDir, "src"), join(uiDir, "dist"), ...scanDirs] : scanDirs;
  return [
    ...tailwind,
    `@import "tw-animate-css";`,
    uiDir ? `@import "@glasshome/ui/styles/theme";` : `@reference "@glasshome/ui/styles/theme";`,
    ...sources.filter((dir) => existsSync(dir)).map((dir) => `@source "${normalizePath(dir)}";`),
    `@custom-variant dark {`,
    `  &:is(.dark *) { @slot }`,
    `  :host(.dark) & { @slot }`,
    `}`,
    "",
  ].join("\n");
}

// A Vite lib build emits the CSS its entry imports as `<name>.css`, so the entry is a wrapper importing the generated Tailwind file first.
export function createWidgetBuildEntry(
  root: string,
  name: string,
  widgetEntry: string,
  srcDir: string,
  manifestPath: string,
): string {
  const cacheDir = resolve(root, BUILD_CACHE_DIR);
  mkdirSync(cacheDir, { recursive: true });

  const uiStyles = resolveExported("@glasshome/ui/styles");
  if (!uiStyles) {
    throw new Error(
      "[widget-sdk] @glasshome/ui is required to build widgets (it provides the theme " +
        "every GlassHome widget ships with). Add it to your widget's dependencies.",
    );
  }
  const sdkSources = resolveExported("@glasshome/widget-sdk/tailwind-sources");
  const sdkDir = sdkSources ? dirname(sdkSources) : null;
  const scanDirs = [
    ...(sdkDir ? [join(sdkDir, "src"), join(sdkDir, "dist")] : []),
    ...widgetProjectScanDirs(srcDir, widgetEntry),
  ];
  const uiDir = hostStylesUi(readSdkRange(manifestPath))
    ? null
    : resolve(dirname(uiStyles), "../..");

  const cssPath = resolve(cacheDir, `${name}.tailwind.css`);
  writeFileSync(cssPath, widgetTailwindEntry(scanDirs, uiDir));

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

/** Some embedded WebViews (Shelly Wall Display) drop hex colors with alpha, so
 *  the minifier must keep `transparent` / `rgba()` instead of `#0000` / `#rrggbbaa`. */
export function widgetCssConfig() {
  // Required lazily: vite bundles the consumer's vite.config with rolldown, and
  // lightningcss's native binding cannot survive that bundle.
  const require = createRequire(import.meta.url);
  const { Features } = require("lightningcss") as { Features: typeof LightningFeatures };
  return { lightningcss: { include: Features.HexAlphaColors } };
}

/** Tailwind's vite plugin, constrained to build so dev-server setups that already run it don't double-process. */
export function buildOnlyTailwind(): Plugin[] {
  const plugins = tailwindcss() as Plugin[];
  for (const p of plugins) {
    p.apply ??= "build";
  }
  return plugins;
}
