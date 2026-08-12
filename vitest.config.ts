import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Mount tests for SDK components. `bun test` cannot compile Solid JSX, which is
// why the component tests here used to assert their own source text; that is
// blind to behaviour by construction. Logic tests stay on `bun test src`;
// anything that renders or reacts lives in tests/dom/ and runs here. The two
// runners never see each other's files.
export default defineConfig({
  plugins: [solid()],
  resolve: {
    conditions: ["browser", "development"],
    dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
  },
  test: {
    environment: "happy-dom",
    // @solidjs/testing-library registers its cleanup on a global afterEach;
    // without globals every mount leaks into the next test's document.
    globals: true,
    include: ["tests/dom/**/*.test.{ts,tsx}"],
    // Bound workers and per-worker heap: a leaking suite must fail with a heap
    // error, not exhaust system memory (unbounded forks each default to ~4GB).
    maxWorkers: 2,
    execArgv: ["--max-old-space-size=2048"],
  },
});
