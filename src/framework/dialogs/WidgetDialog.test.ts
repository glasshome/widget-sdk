/**
 * Source-literal wiring tests for the schema-save validation gate, same style
 * as core/Widget.test.ts (the dialog needs a DOM + injected ui components to
 * mount; the validation logic itself is unit-tested in validate-config.test.ts).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

const SRC = readFileSync(resolve(import.meta.dir, "WidgetDialog.tsx"), "utf8");
const COLLAPSED = SRC.replace(/\s+/g, " ");

describe("WidgetDialog validates on schema save", () => {
  test("imports validateConfigDraft", () => {
    expect(SRC).toContain('import { validateConfigDraft } from "./validate-config"');
  });

  test("handleSchemaSave gates onConfigSave behind validation", () => {
    const save = COLLAPSED.match(/const handleSchemaSave = \(\) => \{.*?\};/)?.[0] ?? "";
    expect(save).toContain("validateConfigDraft(schema, draftConfig())");
    // Failure path returns before onConfigSave.
    expect(save).toMatch(/if \(errors\) \{ setConfigErrors\(errors\); return; \}/);
    // Success path still saves the draft.
    expect(save).toContain("local.onConfigSave?.(draftConfig())");
  });

  test("surfaces issues through the injected SchemaForm errors prop", () => {
    expect(COLLAPSED).toContain("errors={configErrors()}");
  });

  test("closing the dialog resets the draft and clears stale errors", () => {
    const close = COLLAPSED.match(/const handleSchemaClose = \(open: boolean\) => \{.*?\};/)?.[0] ?? "";
    expect(close).toContain("setConfigErrors([])");
  });
});
