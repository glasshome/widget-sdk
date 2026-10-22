import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import { mouse } from "./tests/dom/harness/commands";

// Forked workers inherit it, so a direct run matches the gate; bun test is UTC already.
process.env.TZ = "UTC";

export default defineConfig({
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
    ],
  },
  optimizeDeps: {
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
    ],
  },
  test: {
    // Unset, vite-plugin-solid asks for jsdom, which a standalone clone does not install.
    environment: "node",
    // @solidjs/testing-library registers its cleanup on a global afterEach.
    globals: true,
    include: ["tests/dom/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/dom/harness/setup.ts"],
    maxWorkers: 4,
    browser: {
      enabled: true,
      headless: true,
      screenshotFailures: false,
      viewport: { width: 1024, height: 768 },
      provider: playwright({
        // test-change-ok a press that cannot land fails in 5 s instead of waiting out the test
        actionTimeout: 5000,
        contextOptions: { permissions: ["clipboard-read", "clipboard-write"] },
      }),
      instances: [{ browser: "chromium" }],
      commands: { mouse },
    },
  },
});
