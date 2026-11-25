import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { formatSchemaError, widgetManifestSchema } from "@glasshome/widget-contract";

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
