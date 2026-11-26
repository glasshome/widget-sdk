import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "vite";
import { guestSurfaceGuard, isWidgetExternal } from "./import-guards";

const tmpDir = mkdtempSync(join(import.meta.dir, ".guest-surface-test-"));

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function buildEntry(name: string, source: string) {
  const entry = join(tmpDir, `${name}.js`);
  writeFileSync(entry, source);
  return build({
    configFile: false,
    logLevel: "silent",
    plugins: [guestSurfaceGuard()],
    build: {
      outDir: join(tmpDir, "dist"),
      emptyOutDir: false,
      write: false,
      lib: { entry, formats: ["es"], fileName: name },
      rollupOptions: { external: isWidgetExternal },
    },
  });
}

describe("guestSurfaceGuard", () => {
  test("a bundle importing only what the SDK 2 guest serves builds", async () => {
    await expect(
      buildEntry(
        "served",
        `import { createSignal } from "solid-js";
import { insert } from "@solidjs/web";
import { Widget } from "@glasshome/widget-sdk";
export default [createSignal, insert, Widget];`,
      ),
    ).resolves.toBeDefined();
  });

  test("a withheld name or a module SDK 2 no longer serves fails the build", async () => {
    const failure = await buildEntry(
      "withheld",
      `import { hydrate } from "@solidjs/web";
import { createStore } from "solid-js/store";
export default [hydrate, createStore];`,
    ).catch((err: unknown) => String(err));
    expect(failure).toContain("withheld.js: @solidjs/web: hydrate");
    expect(failure).toContain("withheld.js: solid-js/store: not served to this major");
  });
});
