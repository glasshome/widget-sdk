import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type CapabilityGrant, matchesRead } from "@glasshome/widget-contract";
import { sdkImportsOf } from "@glasshome/widget-contract/sdk-floor";
import { assertNoHostThemeVars } from "./css-guard";
import type { ExampleConfigIssue, WidgetIntrospection } from "./introspect-core";
import {
  type IntrospectResult,
  type IntrospectSession,
  introspectOnce,
} from "./introspect-session";

/**
 * Bump when the serialiser changes. A record written under an older version is
 * not comparable, so it is re-recorded instead of failing the build.
 */
const SCHEMA_HASH_VERSION = 2;

/** Key-ordered at every depth; array order is preserved because `enum` order is part of the shape. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const source = value as Record<string, unknown>;
    const entries = Object.keys(source)
      .sort()
      .filter((key) => source[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableStringify(source[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * Produces a stable 16-char hex hash of a JSON Schema object.
 * Used to detect shape changes between builds so we can warn when configVersion was not bumped.
 */
function hashSchema(jsonSchema: object): string {
  return createHash("sha256").update(stableStringify(jsonSchema)).digest("hex").slice(0, 16);
}

interface SchemaGuardRecord {
  hash: string;
  configVersion: number | null;
  hashVersion?: number;
}

/** The most previews the hub renders; declaring more fails the build instead of dropping extras. */
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

/**
 * Facts only the bundle knows, so only these are written to disk.
 *
 * The inverse list (everything the file already holds) stays authoritative on
 * purpose. `sdkVersion` is the case that proves it: the disk value is the one
 * that ships and is gated twice, while the value inside `defineWidget` has
 * drifted to a stale range in 17 of 19 official widgets. Generating from the
 * bundle would publish the dead one. `version` is a release fact the publish
 * CLI owns, never the bundle.
 *
 * The write is per-key and only fires when the bundle declares the key, so a
 * widget that has not moved `defaultSize`/`capabilities` into `defineWidget`
 * keeps its file values. Authors migrate a field by moving it into
 * `defineWidget` and deleting it from the file; until then the file wins.
 */
const BUNDLE_OWNED_MANIFEST_KEYS = [
  "schema",
  "defaultConfig",
  "examples",
  "configVersion",
  "defaultSize",
  "capabilities",
  "name",
  "description",
  "icon",
  "minSize",
  "maxSize",
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

/** SDK hooks that read a fixed entity on the widget's behalf, so the widget must declare that read. */
export const HOOK_READS: Record<string, string> = { useDaylight: "sun.sun" };

export function assertHookReadsDeclared(
  code: string,
  capabilities: readonly CapabilityGrant[],
  widgetName: string,
): void {
  const imports = sdkImportsOf(code);
  for (const [hook, entityId] of Object.entries(HOOK_READS)) {
    if (!imports.has(hook) && !imports.has("*")) continue;
    if (matchesRead(capabilities, entityId)) continue;
    const domain = entityId.split(".")[0];
    throw new Error(
      `[widget-sdk] "${widgetName}" uses ${hook}(), which reads ${entityId}, but its capabilities grant no read of it.\n` +
        `  Add { "domain": "${domain}", "access": "read" } to capabilities, so the homeowner is told before installing.`,
    );
  }
}

export type Introspector = (outFile: string) => IntrospectResult | Promise<IntrospectResult>;

function assertSchemaRecordCurrent(args: {
  currentRecord: string;
  hash: string;
  configVersion: number | null;
  widgetName: string;
  hashFile: string;
}): void {
  const { hash, configVersion, widgetName, hashFile } = args;
  const raw = args.currentRecord.trim();
  let recorded: SchemaGuardRecord | null = null;
  if (raw.startsWith("{")) {
    try {
      recorded = JSON.parse(raw) as SchemaGuardRecord;
    } catch {
      recorded = null;
    }
  }
  if (recorded && recorded.hashVersion === SCHEMA_HASH_VERSION) {
    if (recorded.hash !== hash && recorded.configVersion === configVersion) {
      throw new Error(
        `[widget-sdk] Config schema shape changed for "${widgetName}" without a configVersion bump. ` +
          `Bump configVersion in defineWidget (currently ${configVersion ?? "unset"}) or revert the schema change, ` +
          `then rebuild. Recorded in ${hashFile}`,
      );
    }
  } else {
    console.warn(
      `[widget-sdk] Schema shape record for "${widgetName}" was written by an older SDK, so it cannot be ` +
        `compared. Re-recording it under hash format ${SCHEMA_HASH_VERSION}. This build is not checked for a ` +
        `missing configVersion bump; the next one is. (${hashFile})`,
    );
  }
}

export async function runSchemaGuard(args: {
  outFile: string;
  hashFile: string;
  widgetName: string;
  manifestPath?: string;
  /** Persistent worker to reuse. Only `bun widget connect`'s watch loop passes one. */
  session?: IntrospectSession;
  /** Reads the bundle when no session is given. Defaults to one subprocess per call. */
  introspect?: Introspector;
}): Promise<void> {
  if (!existsSync(args.outFile)) return;

  const read = args.session
    ? await args.session.introspect(args.outFile)
    : await (args.introspect ?? introspectOnce)(args.outFile);
  if (!read.ok) {
    // Fatal: a warning would let an unchecked widget reach publish.
    throw new Error(
      `[widget-sdk] Could not read "${args.widgetName}" to check it: ${read.reason}\n` +
        "  Its examples and config schema could not be validated, so the build cannot continue.\n" +
        "  This usually means the bundle throws while being imported.",
    );
  }

  const def = read.value;
  const declaredName = def.manifest?.name ?? args.widgetName;
  // Shape first, or a malformed entry reads as a schema rejection.
  await assertExamplesValid(def.manifest?.examples, declaredName);
  assertExampleConfigsValid(def.exampleConfigIssues, declaredName);

  const jsonSchema = def.jsonSchema;
  const manifestFile =
    args.manifestPath && existsSync(args.manifestPath) ? args.manifestPath : null;
  if (jsonSchema && manifestFile) writeGeneratedManifest(manifestFile, def, jsonSchema);
  // Checked against the manifest as written, since that file is what publish ships.
  const shipped: CapabilityGrant[] | undefined = manifestFile
    ? JSON.parse(readFileSync(manifestFile, "utf-8")).capabilities
    : def.manifest?.capabilities;
  assertHookReadsDeclared(readFileSync(args.outFile, "utf-8"), shipped ?? [], declaredName);

  if (!jsonSchema) return;

  const hash = hashSchema(jsonSchema);
  const configVersion = def.manifest?.configVersion ?? null;
  const widgetName = def.manifest?.name ?? args.widgetName;

  const currentRecord = existsSync(args.hashFile) ? readFileSync(args.hashFile, "utf-8") : null;
  if (currentRecord !== null) {
    assertSchemaRecordCurrent({
      currentRecord,
      hash,
      configVersion,
      widgetName,
      hashFile: args.hashFile,
    });
  }

  const nextRecord = `${JSON.stringify({ hash, configVersion, hashVersion: SCHEMA_HASH_VERSION })}\n`;
  if (nextRecord !== currentRecord) writeFileSync(args.hashFile, nextRecord);
}

/** The two checks every built widget passes, in this order: host theme vars in its CSS, then the schema guard on its bundle. */
export async function checkBuiltWidget(args: {
  outDir: string;
  name: string;
  hashFile: string;
  manifestPath: string;
  session?: IntrospectSession;
}): Promise<void> {
  assertNoHostThemeVars(args.outDir, args.name);
  await runSchemaGuard({
    outFile: join(args.outDir, `${args.name}.js`),
    hashFile: args.hashFile,
    widgetName: args.name,
    manifestPath: args.manifestPath,
    session: args.session,
  });
}
