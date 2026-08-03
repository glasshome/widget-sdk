import type { ZodType } from "zod";

/** `nodes[3].label: message` for field issues, bare message for root issues. */
function formatIssuePath(path: PropertyKey[]): string {
  let out = "";
  for (const seg of path) {
    if (typeof seg === "number") out += `[${seg}]`;
    else out += out ? `.${String(seg)}` : String(seg);
  }
  return out;
}

/**
 * Save-gate for the widget dialog's schema editor: runs the widget's real zod
 * config schema over the draft. Returns readable message strings for the
 * SchemaForm `errors` prop, or null when the draft is valid. Cross-item rules
 * (zod `.check()` on an array) land at the list path, e.g. "nodes: <message>".
 */
export function validateConfigDraft(
  schema: ZodType,
  draft: Record<string, unknown>,
): string[] | null {
  const result = schema.safeParse(draft);
  if (result.success) return null;
  return result.error.issues.map((issue) => {
    const path = formatIssuePath(issue.path);
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}
