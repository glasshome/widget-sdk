import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import solid from "vite-plugin-solid";
import { searchForWorkspaceRoot } from "vite";
import { defineConfig } from "vitest/config";
import { mouse, touch } from "./tests/dom/harness/commands";

// Forked workers inherit it, so a direct run matches the gate; bun test is UTC already.
process.env.TZ = "UTC";

const PICK =
  "const s=require('net').createServer().listen(0,'localhost',()=>{console.log(s.address().port);s.close()})";

// Vitest's default counts up from 63315 in every process, so two suites would probe the same ports.
function ownPort(name: string): number {
  process.env[name] ??= execFileSync(process.execPath, ["-e", PICK]).toString().trim();
  return Number(process.env[name]);
}

// A gate run names a results directory; the runner keeps junit and failure shots there.
const resultsDir = process.env.GATE_RESULTS_DIR;
const shuffleSeed = process.env.GATE_SHUFFLE_SEED;

export default defineConfig({
  // A failure screenshot is written through the dev server, which serves only allowed roots.
  server: {
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), ...(resultsDir ? [resultsDir] : [])] },
  },
  plugins: [solid({ dev: false, hot: false }), tailwindcss()],
  resolve: {
    // No "@glasshome/source": ui publishes dist, and this suite runs in the standalone clone too.
    conditions: ["browser"],
    dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
    // The host imports the SDK by name to share its module state; here that is the source under test.
    alias: [
      {
        find: /^@glasshome\/widget-sdk$/,
        replacement: resolve(import.meta.dirname, "src/index.ts"),
      },
      {
        find: /^@glasshome\/widget-sdk\/media\/camera-stream$/,
        replacement: resolve(import.meta.dirname, "src/media/camera-stream.tsx"),
      },
    ],
  },
  optimizeDeps: {
    // A dependency found mid-run re-optimizes and reloads the page, failing the in-flight test import.
    noDiscovery: true,
    include: [
      "solid-js",
      "solid-js/web",
      "solid-js/store",
      "@solidjs/testing-library",
      "clsx",
      "tailwind-merge",
      "zod",
      "@glasshome/ui > cva",
      "@glasshome/ui > embla-carousel",
      "@glasshome/ui > embla-carousel-autoplay",
      "@glasshome/ui > embla-carousel-fade",
      "@glasshome/ui > @iconify/utils",
      "@glasshome/sync-layer > home-assistant-js-websocket",
      "@glasshome/widget-contract > semver",
    ],
  },
  test: {
    sequence: shuffleSeed ? { shuffle: true, seed: Number(shuffleSeed) } : undefined,
    // Whole values in test.each titles keep two cases from sharing one results-ledger id.
    taskTitleValueFormatTruncate: 0,
    attachmentsDir: resultsDir ? `${resultsDir}/attachments` : undefined,
    reporters: resultsDir
      ? ["default", ["junit", { outputFile: `${resultsDir}/vitest.xml` }]]
      : ["default"],
    // test-change-ok hang guard for expect.poll and expect.element, below the 5 s testTimeout; provisional until the nightly stress ledger measures it
    expect: { poll: { timeout: 4_000 } },
    // Unset, vite-plugin-solid asks for jsdom, which a standalone clone does not install.
    environment: "node",
    // @solidjs/testing-library registers its cleanup on a global afterEach.
    globals: true,
    include: ["tests/dom/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/dom/harness/setup.ts"],
    maxWorkers: 4,
    browser: {
      enabled: true,
      api: { port: ownPort("WIDGET_SDK_BROWSER_PORT"), strictPort: true },
      headless: true,
      screenshotFailures: Boolean(resultsDir),
      viewport: { width: 1024, height: 768 },
      provider: playwright({
        // test-change-ok a press that cannot land fails in 5 s instead of waiting out the test
        actionTimeout: 5000,
        contextOptions: { permissions: ["clipboard-read", "clipboard-write"] },
      }),
      instances: [{ browser: "chromium" }],
      commands: { mouse, touch },
    },
  },
});
