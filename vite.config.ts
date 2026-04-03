import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        schemas: "src/schemas.ts",
        "vite/index": "src/vite/index.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "solid-js",
        "solid-js/web",
        "solid-js/store",
        "vite",
        "node:crypto",
        "node:fs",
        "node:path",
        "node:url",
        // Peer/workspace dependencies -- not bundled
        "@glasshome/ui",
        "@modular-forms/solid",
        "@solid-primitives/resize-observer",
        "clsx",
        "tailwind-merge",
        "zod",
      ],
    },
  },
});
