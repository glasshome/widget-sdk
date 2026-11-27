import { OBSERVE } from "solid-js";
import { afterEach, beforeEach, expect } from "vitest";

export interface DiagnosticAllowance {
  code: string;
  test: string;
  item: string;
}

const REAL_BUGS: ReadonlySet<string> = new Set([
  "STRICT_READ_UNTRACKED",
  "REACTIVE_WRITE_IN_OWNED_SCOPE",
  "ASYNC_STORE_SETTER",
  "STORE_WRITE_OUTSIDE_SETTER",
  "STORE_WRITE_THROUGH_LOADING",
  "ACTION_CALLED_IN_OWNED_SCOPE",
  "RUN_WITH_DISPOSED_OWNER",
  "NO_OWNER_CLEANUP",
  "CLEANUP_IN_FORBIDDEN_SCOPE",
  "SETTLED_CLEANUP_UNOWNED",
  "ON_FLUSH_IN_OWNED_SCOPE",
  "FLUSH_IN_EFFECT_CALLBACK",
  "PRIMITIVE_IN_FORBIDDEN_SCOPE",
  "PRIMITIVE_IN_EFFECT_CALLBACK",
  "NO_OWNER_EFFECT",
  "NO_OWNER_BOUNDARY",
  "ASYNC_OUTSIDE_LOADING_BOUNDARY",
  "LOADING_ON_OUTSIDE_HOLD",
  "LOADING_ON_ACCESSOR",
  "INVALID_REFRESH_TARGET",
  "INVALID_AFFECTS_TARGET",
  "MISSING_EFFECT_FN",
  "SYNC_NODE_RECEIVED_ASYNC",
  "UNTRACKED_READ_AFTER_AWAIT",
  "PENDING_ASYNC_UNTRACKED_READ",
  "PENDING_ASYNC_FORBIDDEN_SCOPE",
  "CAUGHT_REACTIVE_READ",
  "OPTIMISTIC_WRITE_BEFORE_LOAD",
  "OPTIMISTIC_WRITE_WHILE_LOADING",
  "LOWERCASE_EVENT_ATTRIBUTE",
  "INVALID_HTML_NESTING",
]);

export function installSolidDiagnosticGuard(allow: readonly DiagnosticAllowance[] = []): void {
  for (const row of allow) {
    if (!/^\d{4}-\d{2}-\d{2}-/.test(row.item)) {
      throw new Error(`allowance for ${row.code} must name a docs/work item id, got "${row.item}"`);
    }
  }
  let capture: ReturnType<NonNullable<typeof OBSERVE>["diagnostics"]["capture"]> | undefined;

  beforeEach(() => {
    capture = OBSERVE?.diagnostics.capture();
  });

  afterEach(() => {
    const events = capture?.stop() ?? [];
    capture = undefined;
    const test = expect.getState().currentTestName ?? "";
    const failures = events.filter(
      (event) =>
        (event.severity === "error" || REAL_BUGS.has(event.code)) &&
        !allow.some((row) => row.code === event.code && row.test === test),
    );
    if (failures.length === 0) return;
    const lines = failures.map(
      (event) =>
        (event.message.split("\n")[0] ?? event.code) +
        (event.ownerPath ? ` in ${event.ownerPath.join(" > ")}` : "") +
        (event.loc ? ` at ${event.loc}` : ""),
    );
    throw new Error(`Solid diagnostics fired in this test:\n${lines.join("\n")}`);
  });
}
