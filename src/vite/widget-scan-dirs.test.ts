import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { widgetProjectScanDirs } from "./index";

const src = join(mkdtempSync(join(tmpdir(), "glasshome-scan-dirs-")), "src");

function widget(name: string): string {
  const dir = join(src, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.tsx"), "export default {};\n");
  writeFileSync(join(dir, "manifest.json"), "{}\n");
  return join(dir, "index.tsx");
}

const alpha = widget("alpha");
widget("beta");
for (const shared of ["common", "_art"]) mkdirSync(join(src, shared), { recursive: true });

afterAll(() => {
  rmSync(join(src, ".."), { recursive: true, force: true });
});

describe("widgetProjectScanDirs", () => {
  const dirs = widgetProjectScanDirs(src, alpha);

  test("carries the widget's own folder", () => {
    expect(dirs).toContain(join(src, "alpha"));
  });

  test("carries every shared folder, so a shared component's utilities are emitted", () => {
    expect(dirs).toContain(join(src, "common"));
    expect(dirs).toContain(join(src, "_art"));
  });

  test("leaves a sibling widget out, so its utilities stay in its own bundle", () => {
    expect(dirs).not.toContain(join(src, "beta"));
  });
});
