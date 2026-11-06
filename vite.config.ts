import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        schemas: "src/schemas.ts",
        deprecations: "src/deprecations.ts",
        "media/camera-source": "src/media/camera-source.ts",
        "media/camera-stream": "src/media/camera-stream.tsx",
        "host/index": "src/host/index.ts",
        "vite/index": "src/vite/index.ts",
        "vite/introspect": "src/vite/introspect.ts",
        "vite/introspect-worker": "src/vite/introspect-worker.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "solid-js",
        "solid-js/web",
        "solid-js/store",
        "vite",
        "node:child_process",
        "node:crypto",
        "happy-dom",
        "node:fs",
        "node:module",
        "node:path",
        "node:url",
        // This package, by its own name. `src/host/instantiate-widget.ts`
        // self-references so `WidgetCtx` keeps a single address across every
        // build shape; inlining it here would defeat that and restore the
        // duplicate-context bug (finding 45).
        "@glasshome/widget-sdk",
        // Its own module, so a sealed engine can seat the host's CameraStream in its place.
        "@glasshome/widget-sdk/media/camera-stream",
        // Peer/workspace dependencies -- not bundled
        "@glasshome/sync-layer",
        "@glasshome/sync-layer/solid",
        "@glasshome/ui",
        "@glasshome/ui/solid",
        "@glasshome/widget-contract",
        "@glasshome/widget-contract/sdk-floor",
        "@tailwindcss/vite",
        "@solid-primitives/resize-observer",
        "clsx",
        "hls.js",
        "tailwind-merge",
        "zod",
      ],
    },
  },
});
