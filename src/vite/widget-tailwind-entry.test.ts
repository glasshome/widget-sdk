import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hostStylesUi, widgetTailwindEntry } from "./index";

describe("hostStylesUi", () => {
  test("holds for a floor at or past the first host that styles ui itself", () => {
    expect(hostStylesUi("^1.24.0")).toBe(true);
    expect(hostStylesUi("^1.32.4")).toBe(true);
    expect(hostStylesUi(">=1.28.0 <2.0.0")).toBe(true);
  });

  test("fails for a range that still admits an older host", () => {
    expect(hostStylesUi("^1.17.0")).toBe(false);
    expect(hostStylesUi("^1.23.1")).toBe(false);
    expect(hostStylesUi(">=1.20.0")).toBe(false);
    expect(hostStylesUi("^1.24.0-beta.1")).toBe(false);
  });

  test("fails without a readable range", () => {
    expect(hostStylesUi(undefined)).toBe(false);
    expect(hostStylesUi("")).toBe(false);
    expect(hostStylesUi("not a range")).toBe(false);
  });
});

describe("widgetTailwindEntry", () => {
  const root = mkdtempSync(join(tmpdir(), "glasshome-tailwind-entry-"));
  const widgetDir = join(root, "widget");
  const uiDir = join(root, "ui");
  for (const dir of [widgetDir, join(uiDir, "src"), join(uiDir, "dist")])
    mkdirSync(dir, { recursive: true });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  test("a widget whose hosts all style ui scans only its own sources and emits no ui rules", () => {
    const entry = widgetTailwindEntry([widgetDir], null);
    expect(entry).toContain(`@source "${widgetDir}";`);
    expect(entry).not.toContain(uiDir);
    expect(entry).toContain(`@reference "@glasshome/ui/styles/theme";`);
    expect(entry).not.toContain(`@import "tailwindcss" `);
  });

  test("a widget an older host can run carries all of ui", () => {
    const entry = widgetTailwindEntry([widgetDir], uiDir);
    expect(entry).toContain(`@source "${join(uiDir, "src")}";`);
    expect(entry).toContain(`@source "${join(uiDir, "dist")}";`);
    expect(entry).toContain(`@import "@glasshome/ui/styles/theme";`);
    expect(entry).toContain(`@import "tailwindcss" source(none);`);
  });
});
