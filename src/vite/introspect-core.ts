/**
 * Reads a built widget bundle's definition under a fake DOM.
 *
 * A widget bundle cannot be imported by the build process: `solid-js/web`
 * resolves to its server build under Node's conditions and throws the moment
 * the module initialises, and browser conditions then need a DOM for the
 * templates Solid creates at import time. Both callers (the one-shot
 * `introspect.ts` CLI and the persistent `introspect-worker.ts`) run under
 * `--conditions browser` and install a DOM before importing.
 */

import { copyFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";

export interface ExampleConfigIssue {
  index: number;
  label?: string;
  problems: string[];
}

export interface WidgetIntrospection {
  manifest:
    | ({ name?: string; configVersion?: number; examples?: unknown } & Record<string, unknown>)
    | null;
  /** JSON Schema derived from the widget's configSchema, when it has one. */
  jsonSchema: object | null;
  /** Examples whose config the widget's own configSchema rejects. */
  exampleConfigIssues: ExampleConfigIssue[];
}

interface ZodLike {
  safeParse: (value: unknown) => {
    success: boolean;
    error?: { issues: Array<{ path: PropertyKey[]; message: string }> };
  };
}

function isZodLike(value: unknown): value is ZodLike {
  return typeof (value as ZodLike | undefined)?.safeParse === "function";
}

/**
 * Parse every example's config against the widget's real `configSchema`.
 *
 * Done here rather than in the build process because this is the only place the
 * live zod schema exists: the build only ever sees the JSON Schema derived from
 * it, which loses refinements. `WidgetExample<C>.config` is checked by tsc
 * against the config *type*, but the type and the schema can disagree and only
 * the schema carries runtime constraints, so an example can typecheck and still
 * render an empty widget.
 */
function collectExampleConfigIssues(
  configSchema: unknown,
  examples: unknown,
): ExampleConfigIssue[] {
  if (!isZodLike(configSchema) || !Array.isArray(examples)) return [];

  const issues: ExampleConfigIssue[] = [];
  for (const [index, entry] of examples.entries()) {
    const config = (entry as { config?: unknown } | null)?.config;
    // A missing or non-object config is the shape guard's error to report.
    if (typeof config !== "object" || config === null) continue;

    const result = configSchema.safeParse(config);
    if (result.success) continue;

    issues.push({
      index,
      label: (entry as { label?: string }).label,
      problems: (result.error?.issues ?? []).map((issue) => {
        const path = issue.path.map(String).join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      }),
    });
  }
  return issues;
}

const DOM_GLOBALS = [
  "window",
  "document",
  "navigator",
  "location",
  "customElements",
  "HTMLElement",
  "Element",
  "Node",
  "CSS",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "matchMedia",
] as const;

/**
 * Install a fresh DOM. Unconditional: the persistent worker calls this per
 * request, and skipping already-set keys would leak the previous widget's
 * mutated window into the next one.
 */
export async function installDom(): Promise<void> {
  const { Window } = await import("happy-dom");
  const win = new Window({ url: "http://localhost" }) as unknown as Record<string, unknown>;
  for (const key of DOM_GLOBALS) {
    try {
      Object.defineProperty(globalThis, key, {
        value: win[key],
        configurable: true,
        writable: true,
      });
    } catch {
      // Some runtime-owned globals (navigator, location) are non-configurable.
    }
  }
}

interface WidgetModule {
  default?: { manifest?: WidgetIntrospection["manifest"]; configSchema?: unknown };
}

/**
 * Import the bundle so a rewrite of the same path is actually re-evaluated.
 *
 * Bun's ESM registry keys on the resolved file path and ignores a `?t=` query,
 * so cache-busting has to change the path. The copy is a sibling of the
 * original: bare specifiers inside the bundle resolve from the importing file's
 * directory, and a temp dir elsewhere would not find node_modules.
 */
async function importFresh(bundlePath: string, cacheBust: string): Promise<WidgetModule> {
  const copy = `${bundlePath}.introspect-${cacheBust}.mjs`;
  copyFileSync(bundlePath, copy);
  try {
    // Windows drive paths ("C:\\…") parse as a URL scheme under Node's ESM loader.
    return (await import(pathToFileURL(copy).href)) as WidgetModule;
  } finally {
    rmSync(copy, { force: true });
  }
}

export async function introspectBundle(
  bundlePath: string,
  cacheBust?: string,
): Promise<WidgetIntrospection> {
  const mod = cacheBust
    ? await importFresh(bundlePath, cacheBust)
    : ((await import(pathToFileURL(bundlePath).href)) as WidgetModule);
  const def = mod.default;

  let jsonSchema: object | null = null;
  if (def?.configSchema) {
    const { z } = await import("zod");
    jsonSchema = z.toJSONSchema(def.configSchema as Parameters<typeof z.toJSONSchema>[0], {
      unrepresentable: "any",
    });
  }

  return {
    manifest: def?.manifest ?? null,
    jsonSchema,
    exampleConfigIssues: collectExampleConfigIssues(def?.configSchema, def?.manifest?.examples),
  };
}
