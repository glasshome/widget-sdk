/**
 * Reads a built widget bundle's definition and prints it as JSON.
 *
 * Runs as its own process because a widget bundle cannot be imported by the
 * build: `solid-js/web` resolves to its server build under Node's conditions
 * and throws "Client-only API called on the server side" the moment the module
 * initialises, and forcing browser conditions then needs a DOM for the
 * templates Solid creates at import time. The build spawns this with
 * `--conditions browser` and a DOM in place, so the import succeeds.
 *
 * Until this existed the guard swallowed that import failure and silently did
 * nothing — for every widget, on every build.
 *
 * Usage: bun --conditions browser introspect.js <bundle.js>
 * Prints: { manifest, jsonSchema } on stdout, or exits non-zero with a reason.
 */

interface Introspection {
  manifest: {
    name?: string;
    configVersion?: number;
    examples?: unknown;
  } | null;
  /** JSON Schema derived from the widget's configSchema, when it has one. */
  jsonSchema: object | null;
  /** Examples whose config the widget's own configSchema rejects. */
  exampleConfigIssues: ExampleConfigIssue[];
}

export interface ExampleConfigIssue {
  index: number;
  label?: string;
  problems: string[];
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

async function installDom(): Promise<void> {
  const { Window } = await import("happy-dom");
  const win = new Window({ url: "http://localhost" });
  const globals = [
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
  for (const key of globals) {
    if ((globalThis as Record<string, unknown>)[key] === undefined) {
      (globalThis as Record<string, unknown>)[key] = (win as unknown as Record<string, unknown>)[
        key
      ];
    }
  }
}

async function main(): Promise<void> {
  const bundlePath = process.argv[2];
  if (!bundlePath) {
    process.stderr.write("introspect: no bundle path given\n");
    process.exit(2);
  }

  await installDom();

  const mod = (await import(bundlePath)) as {
    default?: { manifest?: Introspection["manifest"]; configSchema?: unknown };
  };
  const def = mod.default;

  let jsonSchema: object | null = null;
  if (def?.configSchema) {
    const { z } = await import("zod");
    jsonSchema = z.toJSONSchema(def.configSchema as Parameters<typeof z.toJSONSchema>[0], {
      unrepresentable: "any",
    });
  }

  const out: Introspection = {
    manifest: def?.manifest ?? null,
    jsonSchema,
    exampleConfigIssues: collectExampleConfigIssues(def?.configSchema, def?.manifest?.examples),
  };
  process.stdout.write(JSON.stringify(out));
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
