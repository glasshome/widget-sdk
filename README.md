# @glasshome/widget-sdk

SDK for building GlassHome dashboard widgets with SolidJS.

Provides `defineWidget`, reactive entity bindings, framework components/hooks, a Vite plugin for widget development, and Tailwind v4 source paths — everything you need to build, preview, and ship dashboard widgets.

## Install

```bash
npm install @glasshome/widget-sdk solid-js
# or
bun add @glasshome/widget-sdk solid-js
```

> `solid-js ^1.9.11` is a required peer dependency.

## Subpath Imports

### `@glasshome/widget-sdk` — SDK API

Core widget API: define widgets, create reactive entity bindings, and use framework components/hooks.

```tsx
import { defineWidget, createEntity, SDK_VERSION } from "@glasshome/widget-sdk";

const entity = createEntity("light.living_room");

export default defineWidget({
  manifest: {
    tag: "glasshome-my-widget",
    type: "status",
    name: "My Widget",
    size: "small",
    sdkVersion: "^0.1.0",
    defaultConfig: { label: "Hello" },
  },
  component: (props) => <div>{props.config.label}</div>,
});
```

### `@glasshome/widget-sdk/vite` — Vite Plugin

Vite plugin for widget development. Handles widget bundling, preview server, and registry generation.

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { glasshomeWidget } from "@glasshome/widget-sdk/vite";

export default defineConfig({
  plugins: [glasshomeWidget()],
});
```

The plugin accepts an optional `entry` option (defaults to `"src/index.tsx"`):

```typescript
glasshomeWidget({ entry: "src/my-widget.tsx" });
```

### `@glasshome/widget-sdk/tailwind-sources` — Tailwind v4 CSS Source

Provides a `@source` directive for Tailwind v4 so the compiler scans widget SDK source files for class names.

```css
/* In your widget's CSS entrypoint */
@import "tailwindcss";
@source "@glasshome/widget-sdk/tailwind-sources";
```

## Peer Dependencies

| Package    | Required | Notes                                       |
| ---------- | -------- | ------------------------------------------- |
| `solid-js` | Yes      | SolidJS reactive primitives and JSX runtime |

## License

MIT
