# Changelog

All notable changes to `@glasshome/widget-sdk` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.17.1](https://github.com/glasshome/widget-sdk/compare/v1.17.0...v1.17.1) (2026-09-27)


### Bug Fixes

* **vite:** widget CSS drops self-referencing theme variables, so light mode keeps Geist and shadows ([4c35523](https://github.com/glasshome/widget-sdk/commit/4c355235e7aeef875fa35b9348fa02ee2efeff80))

## [1.17.0](https://github.com/glasshome/widget-sdk/compare/v1.16.0...v1.17.0) (2026-09-27)


### Features

* **config:** field.choice takes icons, field.image takes built-in presets resolved with imageSrc ([9704c3a](https://github.com/glasshome/widget-sdk/commit/9704c3a0bc49248374eacdd8419b37ff366edae5))
* **daylight:** progress through the current day or night from sun.sun ([a99f38b](https://github.com/glasshome/widget-sdk/commit/a99f38ba29a4b9093f3b193cc728d06c935c5a09))
* **panel:** a held tile opens a sheet of only what the tile cannot show ([026423c](https://github.com/glasshome/widget-sdk/commit/026423cd517b474ed4d068dedc0f77544e47c40f))
* **panel:** a sheet wears its tile's look, so the tile reads as growing open ([4b9bd5e](https://github.com/glasshome/widget-sdk/commit/4b9bd5e20e31d7b9c357f1fbb321b77d029b7e01))
* **panel:** an empty tile opens its settings when held, and a widget with nothing extra lands on settings ([d7fad2f](https://github.com/glasshome/widget-sdk/commit/d7fad2f5c2792f1d304da83a6a887f2eec4ad601))
* **panel:** held tiles open a panel, edit mode opens settings, Debug needs Developer Mode ([cc7ca70](https://github.com/glasshome/widget-sdk/commit/cc7ca70c06290fe8faa1c692abe9f8c4e4f3a3e5))
* **panel:** split and keyboard slides, read-only rows, row overrides, and the dock's hold fill on tiles ([d02da5b](https://github.com/glasshome/widget-sdk/commit/d02da5bce82d8a3f1be05c0dbb11f0e2ab533c2f))
* **sdk:** widgets can type a forecast with WeatherForecast and ForecastType ([9265b77](https://github.com/glasshome/widget-sdk/commit/9265b77573da14cec43762d8a4f6de5a97dd127e))
* **sdk:** widgets read the household daylight phase, and wear ui's groups and toggles ([3990b83](https://github.com/glasshome/widget-sdk/commit/3990b83ca760a4b0367895536bd6681768e67f35))
* **theming:** past a 4x4 box the widget icon keeps growing with the short side ([1b9bc7b](https://github.com/glasshome/widget-sdk/commit/1b9bc7bb15072e32122465b7a88c7ee5685abaf2))
* **ui:** ColorDisc and TemperatureBar join the ui re-exports ([e984919](https://github.com/glasshome/widget-sdk/commit/e984919e541bc71f2e0b05852e964645e21b3dbc))
* **vite:** the build refuses a widget that uses useDaylight without declaring a sun read ([410564b](https://github.com/glasshome/widget-sdk/commit/410564bbcecc8b4dbd04ef96b2ba936c85cd7fc3))
* **widget:** the tile anatomy is the SDK's: Widget.Head, Hero, Controls, Stepper, Choice, Action, Chip, Backdrop, Layer and Glyph laid out by Widget.Content, one scale of size tokens, actions that confirm themselves, and a sheet that makes the tile hold and wears its look ([e59155e](https://github.com/glasshome/widget-sdk/commit/e59155ece18ebe51c904b1a52f37228b9a49b23a))


### Bug Fixes

* **deps:** ui 1.20.0, sync-layer 0.9.0, widget-contract 0.3.0 ([811fc1c](https://github.com/glasshome/widget-sdk/commit/811fc1c1abf66b09efb28f624a19b120aa38d74b))
* **dialog:** sheets render when opened, tiles answer the keyboard, and the Widget context keeps the host's fields ([56ab421](https://github.com/glasshome/widget-sdk/commit/56ab421b139e32dc6a6cf822eebad118dc4633a9))
* follow material blur in classic glass widgets ([b622474](https://github.com/glasshome/widget-sdk/commit/b622474b57ec26d529e4ecb2b79354bbc9ea9b21))
* **host:** a widget overlay's document pass leaves no inner node on the event, and a hold keeps its release click ([54b4224](https://github.com/glasshome/widget-sdk/commit/54b4224e1922c3debeb5a84ec1c71b65e2f30c4d))
* **host:** taps reach controls inside a widget's closed root without leaking inner nodes ([5e53624](https://github.com/glasshome/widget-sdk/commit/5e5362411854c121f7f60b54ff82d8b4bfc8464d))
* **icon:** group stack plates match the pill's size and step evenly on both axes ([2cc38ad](https://github.com/glasshome/widget-sdk/commit/2cc38ad05d1c3e7c8bd0dbff56c79579c0d09d28))
* **panel:** a held tile's sheet keeps the dialog's blurred backdrop ([b089eb0](https://github.com/glasshome/widget-sdk/commit/b089eb0bab5345719b3d4dad202a44e69b484efc))
* **panel:** a sheet's icon and title share one axis ([87f89ee](https://github.com/glasshome/widget-sdk/commit/87f89ee8df1a4b4d4a01db442a24dba1f901a846))
* **panel:** the readings strip in a sheet blurs what is behind it, like the buttons ([caf4567](https://github.com/glasshome/widget-sdk/commit/caf4567979df15af79edaf999ce6f4005a841e3f))
* **vite:** Tailwind scans a project's shared folders, never sibling widgets ([275245b](https://github.com/glasshome/widget-sdk/commit/275245bba610415a1562c88637ba5c0f3df57a4f))
* **widget:** past a 4x4 box the icon grows with the short side at the share it has at 4x4 ([0745638](https://github.com/glasshome/widget-sdk/commit/0745638b83e73aeba3f5edda5136028612c2f8a0))
* **widget:** the content caches whether it holds anatomy parts, and a head clears the sheet icon only if it set it ([c44da5a](https://github.com/glasshome/widget-sdk/commit/c44da5aa4b6aa71d96a9b842629c104528d9d1af))
* **widget:** the tile's focus ring sits inside its edge, where the grid cell cannot clip it ([e86a182](https://github.com/glasshome/widget-sdk/commit/e86a1829674259b123a7399c96a7fde254d05f5d))

## [1.16.0](https://github.com/glasshome/widget-sdk/compare/v1.15.1...v1.16.0) (2026-09-22)


### Features

* **dialogs:** the debug tab renders itself from debugData ([f91ac0b](https://github.com/glasshome/widget-sdk/commit/f91ac0bf4842e844df9ffbdfbf713798374635d6))
* **shell:** the card fill follows the theme's material clarity ([4af5fcc](https://github.com/glasshome/widget-sdk/commit/4af5fcc59162a8794732b7b185c12f21ec764831))
* **shell:** the icon disc and slider fill follow the material ([bf8b39d](https://github.com/glasshome/widget-sdk/commit/bf8b39d8fbbcef6ddec611a385d2a08b7ee9cfd2))
* **shell:** the widget shell wears ui's .glass; gradient prop deprecated ([e74fe68](https://github.com/glasshome/widget-sdk/commit/e74fe68e2a6d745e066dad1376c549f68d3e1ae5))


### Bug Fixes

* **deps:** the ui pin follows FactRow into 1.18.0 ([03b8993](https://github.com/glasshome/widget-sdk/commit/03b8993fa2dfbe60800f616bd2c53e1a3d8e9b58))
* **dialogs:** copy from the debug tab copies ([a42a351](https://github.com/glasshome/widget-sdk/commit/a42a35120258c137bcdc552a973784c4870e425a))
* **shell:** a widget without a tone is the plain card, never a neutral wash ([836035c](https://github.com/glasshome/widget-sdk/commit/836035c11074efdac72eff94a3eae77e2afccde2))
* **shell:** the empty state reads theme ink, visible in light mode ([14d56ee](https://github.com/glasshome/widget-sdk/commit/14d56ee3c099ff8e7625fa35a027f14d0b09df21))
* **shell:** the neutral tone paints no wash ([462e9ae](https://github.com/glasshome/widget-sdk/commit/462e9ae9dae764823ee030ad60e6709d549ce6fd))

## [1.15.1](https://github.com/glasshome/widget-sdk/compare/v1.15.0...v1.15.1) (2026-09-12)


### Bug Fixes

* **vite:** the config-shape hash reaches inside properties ([#9](https://github.com/glasshome/widget-sdk/issues/9)) ([cd2fb63](https://github.com/glasshome/widget-sdk/commit/cd2fb6366aef6c346ea7701e8a50b15380f5c1ee))

## [1.15.0](https://github.com/glasshome/widget-sdk/compare/v1.14.3...v1.15.0) (2026-09-12)


### Features

* **config:** field.choice takes labels, field.icon takes a description ([06a23d2](https://github.com/glasshome/widget-sdk/commit/06a23d2e68362dce876c13772477dafbd3d2e67e))
* **config:** field.choices, a multi-select over a fixed set ([6e32ccd](https://github.com/glasshome/widget-sdk/commit/6e32ccdb958cf8f9a47d25b5e26af0677b77886f))
* **context:** ctx.viewer, who is looking ([ac1e0b4](https://github.com/glasshome/widget-sdk/commit/ac1e0b4659832578846a2468416a324c67d51be3))
* **context:** dashboard name, icon and area on the widget context ([efdb225](https://github.com/glasshome/widget-sdk/commit/efdb22505b180013c5e6cb20282f652ce1078ef2))
* **deprecations:** iconify-icon is deprecated; Icon ships from the SDK ([129748f](https://github.com/glasshome/widget-sdk/commit/129748f5bfcbd07b747bd9f3ac497b9fa37120d0))
* **ui:** SectionIcon, SectionTitle and CountPill join the gated barrel ([ec2869c](https://github.com/glasshome/widget-sdk/commit/ec2869cf742db723f2268e3e025e0cf91e03c9f5))


### Bug Fixes

* **deps:** pin ui 1.14.0, which resolves its own json-schema types ([6db8ebd](https://github.com/glasshome/widget-sdk/commit/6db8ebdf6465bd3751618b5c26611d59d244f0f3))
* **vite:** a replaced introspect worker's late exit no longer fails the successor's request ([#5](https://github.com/glasshome/widget-sdk/issues/5)) ([342fb01](https://github.com/glasshome/widget-sdk/commit/342fb01b3dca7d2fda32a0084afc62c659f9542a))

## [1.14.3](https://github.com/glasshome/widget-sdk/compare/v1.14.2...v1.14.3) (2026-09-03)


### Bug Fixes

* **deps:** ui 1.8.0 ([8a3fe52](https://github.com/glasshome/widget-sdk/commit/8a3fe52a2c7e2f2d4b8d3955c83aca8bd6d7086d))

## [1.14.2](https://github.com/glasshome/widget-sdk/compare/v1.14.1...v1.14.2) (2026-09-03)


### Bug Fixes

* **deps:** widget-contract 0.2.1, sync-layer 0.8.1 ([a4fcebf](https://github.com/glasshome/widget-sdk/commit/a4fcebf90ce1c0af47374251bc769e1ad9e90007))
* **shell:** keep the shell's radius utility, align the token to it ([127db7d](https://github.com/glasshome/widget-sdk/commit/127db7d47cb1e0eba2d388ef1dd81c4dc5216008))
* **shell:** one radius token for shell, content and fill ([15e86bd](https://github.com/glasshome/widget-sdk/commit/15e86bd9e4d2348f4fb429f3f2fe27413583957a))
* **shell:** widget labels read the theme's muted ink, not a fixed alpha ([e080d71](https://github.com/glasshome/widget-sdk/commit/e080d71e9d461d66a7e2a655fc2333a6d01f0d6c))

## [1.14.1](https://github.com/glasshome/widget-sdk/compare/v1.14.0...v1.14.1) (2026-08-30)


### Bug Fixes

* **vite:** skip schema-hash write when unchanged ([5502f44](https://github.com/glasshome/widget-sdk/commit/5502f44faa8a6d25b948eee9f62d05212c2d2df4))

## [1.14.0](https://github.com/glasshome/widget-sdk/compare/v1.13.0...v1.14.0) (2026-08-30)


### Features

* **deps:** @glasshome/ui 1.7.0 ([53032d3](https://github.com/glasshome/widget-sdk/commit/53032d343e42ab31d467842b258e005f523c0d61))
* **ui:** re-export Tabs and the ResponsiveDialog body, footer and close parts ([4379edf](https://github.com/glasshome/widget-sdk/commit/4379edf0495894481cd127421dd6e4f38cc8924f))


### Bug Fixes

* **dialogs:** the footer follows the tab the dialog actually shows ([f9267a1](https://github.com/glasshome/widget-sdk/commit/f9267a1f24228b50a4c6100f62c3ac87e1e5b28a))
* **test:** resolve ui the way a consumer does ([7b10e4c](https://github.com/glasshome/widget-sdk/commit/7b10e4cf796fba7944e828bad85a63bacdd19c63))

## [1.11.1] - 2026-08-23

### Fixed

- Widget CSS no longer contains hex colors with alpha (`#0000`, `#rrggbbaa`).
  Some embedded WebViews (Shelly Wall Display) drop those declarations, which
  left the native gray button box visible behind every raw `<button>` in a
  widget and silently removed translucent shadows. Both `glasshomeWidgets()`
  and `glasshomeWidget()` now keep `transparent` / `rgba()` in the built CSS.

## [1.11.0] - 2026-08-18

### Changed

- `bun widget connect` rebuilds faster and no longer fails with `spawnSync ...
  ETIMEDOUT` after the editor has been sitting idle. Every save used to start a
  fresh process to read the built bundle; the session now keeps one running and
  reuses it. A widget that hangs or crashes while being read still fails that
  save, and no longer takes the rest of the session with it.

### Added

- `GLASSHOME_WIDGET_NO_WORKER=1` restores the old one-process-per-save
  behaviour, in case the reused worker misbehaves.

## [1.10.3] - 2026-08-16

### Fixed

- Builds on Windows failed at validation with "Only URLs with a scheme in:
  file, data, and node are supported ... Received protocol 'c:'": the
  introspection step imported the built bundle by filesystem path, which
  Node's ESM loader reads as a URL scheme on drive-letter paths. It now
  imports a `file://` URL.
- `@glasshome/ui` is a required peer again. 1.10.0 marked it optional, so a
  fresh project no longer received it on `bun install` and every build failed
  with "@glasshome/ui is required to build widgets". The runtime is still
  host-provided; the build reads its theme styles and types.

## [1.10.0] - 2026-08-13

### Added

- `useCalendarEvents(entityId, options?)` — live events for a Home Assistant
  calendar entity, with `CalendarEvent`, `CalendarEventsData` and
  `CalendarWindowOptions` types. Backed by `calendar/event/subscribe`,
  ref-counted per entity and resubscribed after a reconnect. This restores
  calendar access for widgets, which lost it when `state.conn` left
  sync-layer's widget-reachable entry in 0.6.0; the hook is read-only and
  cannot reach service calls, so it is a narrower path than the raw
  connection it replaces.
- Service calls can request Home Assistant's service response. Pass
  `{ returnResponse: true }` as the fifth argument to the `callService` from
  `useWidgetContext()`, for services such as `todo.get_items` that return
  data. Capability checks are unchanged: the flag only asks HA to include its
  response.

### Changed

- `ServiceCallFn` returns `Promise<unknown>` instead of `Promise<void>`, to
  carry the service response above. `await callService(...)` is unaffected,
  and the `useService()` shortcuts (`turnOn`, `turnOff`, `toggle`) still
  return `Promise<void>` since commands have no response. Only code that
  assigns `callService` somewhere a `Promise<void>`-returning function is
  required needs a change.

### Note

- Requires `@glasshome/sync-layer` 0.7.0.

## [1.9.2] - 2026-08-10

### Fixed

- `syncLayerImportGuard` enforces its contract again. It detected direct
  `@glasshome/sync-layer` imports in `resolveId`, but rollup consults
  `rollupOptions.external` before plugin resolve hooks, so an externalized
  specifier never reached it: under Vite 8 a widget importing the store directly
  built clean. Detection moved to a `transform` source scan, the same approach
  `uiImportGuard` uses. A widget that bundles its own store copy is disconnected
  from live state, which is why this fails the build rather than warning.
- `@glasshome/ui` is an **optional** peer. It is served by the host, so requiring
  it told every widget project to install a package it never needs; 1.9.0
  declared it as a hard peer to make the SDK's own types resolve.

## [1.9.1] - 2026-08-10

### Fixed

- The host entry reaches `WidgetCtx` by package name rather than a relative
  path, so a host and its widgets share one context instance
  (`scripts/check-host-singleton.ts` gates it).
- The direct-`@glasshome/ui`-import build warning names each offending file once
  per run instead of once per widget bundle. A module shared by every widget was
  restated in every build: 49 widgets meant 55 warnings for 6 files.

## [1.9.0] - 2026-08-08

### Added

- `field.list(item, opts)` renders an add/remove/reorder list of sub-forms.
  `max` is required (hard ceiling 24, since every item is a rendered subtree and
  usually an entity subscription), nesting is depth 1 only (a list inside a
  list throws at definition time, including one hidden in a `variants` branch),
  and `labelField` must name a field present in every item shape.
- `field.variants(discriminator, variants, opts)` builds a discriminated union,
  with optional shared fields merged into every variant and labels for the
  form's kind selector.
- `useWidgetDimensions()`: measured shell dimensions from a context only
  `<Widget>` provides. It throws when called from the top-level widget scope
  instead of silently reading the host stub's (0,0).
- 21 `@glasshome/ui` primitives are re-exported through the main SDK barrel, so
  `sdkVersion` gates them. `@glasshome/ui` stays a host singleton via vite
  externals.
- The build writes the bundle-only facts (config schema, `defaultConfig`,
  `examples`, `configVersion`) into the manifest. Strictly additive: nothing the
  manifest already declares is overwritten. Until now every build derived a
  widget's config schema and threw it away, so no widget had ever published its
  config shape.
- Widget shells wear the shared glass material: variants carry the `CARD_BLUR`
  recipe via `--widget-backdrop`, and `tokens.css` consumes `var(--glass-frost)`
  natively, replacing the bespoke `--gh-pb-*` channel.

### Fixed

- `WidgetDialog` validates the draft against the widget's schema before saving.
  An invalid config used to reach the host and fall back to defaults, silently
  wiping the user's configuration; failures now feed the injected `SchemaForm`'s
  errors instead.
- `examples` entries are validated against the widget's `configSchema`, not just
  shape-checked. An example that satisfies the TypeScript type can still violate
  the runtime constraints the type cannot express (enum members, min/max,
  required fields), which published a storefront picture of a broken widget.
- A failed introspection is fatal. It was a silent return, then a warning, both
  of which left a green build with examples and config schema unvalidated.

### Deprecated

- `ctx.dimensions` (removed in 2.0.0). Use `useWidgetDimensions()`.
- Direct `@glasshome/ui` imports (removed in 2.0.0). Import the same export from
  `@glasshome/widget-sdk`. They keep working but warn at build.

### Removed

- The dead `isEditMode` field on `ReactiveWidgetContext`. Nothing read it.

### Changed

- `@glasshome/sync-layer` peer bumped to 0.5.0.

## [1.4.0] - 2026-07-02

### Added

- **Config API: declare widget config without importing zod.** `defineConfig` +
  `field.*` (`title`, `text`, `number`, `toggle`, `choice`, `entities`, `entity`,
  `area`, `stringList`, `group`) plus the `Infer<>` type. zod becomes a hidden
  implementation detail deduped in the SDK vendor chunk (~55KB off every widget).
- `z` is re-exported from the SDK (`import { z } from "@glasshome/widget-sdk"`) as a
  permanent advanced escape hatch for schemas the config API can't express.
- Deprecation registry (`@glasshome/widget-sdk/deprecations`) drives runtime
  warn-once, the `bun widget build` source lint, and the generated deprecations table.

### Deprecated

- `widgetFields.*` and building a widget's `configSchema` with raw `z.object({...})`
  are deprecated (removed in 2.0.0). Migrate to `defineConfig` + `field.*`.
  `bun widget build`/`connect` warns on each usage; `bun widget migrate config`
  auto-migrates most cases. Deprecated helpers keep working until 2.0.0.

### Upcoming — v2 (breaking)

- **2.0.0 removes `widgetFields` and the raw-zod config path.** `field.*` /
  `defineConfig` become the only way to declare config. The `z` re-export is NOT
  removed: it stays a permanent escape hatch. Migrate before 2.0.0 using the codemod.

## [1.2.0] - 2026-06-14

### Added

- `widgetFields.entityIds(domain, options?)` and
  `widgetFields.singleEntity(domain, options?)` accept an optional
  `{ deviceClass }` to scope the entity picker to a single device class
  (e.g. `widgetFields.entityIds("sensor", { deviceClass: "temperature" })`).
  Emitted as `deviceClass` in the field metadata; the host's config form
  filters the picker accordingly. Backward compatible: the option is
  optional and existing calls are unchanged.

## [0.5.1] - 2026-06-04

Additive groundwork for the upcoming energy widget suite. No breaking
changes; all existing API is untouched.

### Added

- `svgColors`: seven energy color tokens (`solar`, `grid`, `battery`, `ev`,
  `home`, `positive`, `negative`) as OKLCH strings, each with `fill`
  (20% color-mix for area fills), `stroke`, and `solid` channels, plus the
  `SvgColorKey` union type.
- `useReducedMotion()`: reactive accessor over the
  `prefers-reduced-motion` media query. SSR-safe.
- `useIntersectionPause(el)`: accessor that turns `true` while the element
  is outside the viewport, for pausing animations offscreen. SSR-safe.
- `monotoneCubicPath(points)`: the monotone cubic Hermite spline previously
  duplicated inside widgets, now exported from a single shared module.

## [0.5.0] - 2026-05-30

Visual scale moves to pure CSS. The widget shell already declared
`container-type: size; container-name: widget;`, but every icon/text/padding
value was still computed in JS via the `WidgetSize` tier classifier
(`gridWidth = round(width / 150)` etc.). This release deletes the classifier
and drives all visual scale from CSS custom properties + container queries
on `.glasshome-widget`. Widgets at the same rendered box scale identically
without a tier-bucket discontinuity, and resize is smooth instead of stepped.

`useWidgetContext()` shrinks to host RPC, edit mode, and raw measured
dimensions. Widgets that branch rendered content on size (media-player,
weather, area, clock) read `ctx.dimensions().width` / `.height` directly and
apply their own pixel thresholds; no shared tier enum.

Bundle: 50.78 kB → 43.67 kB (gzip 14.99 → 12.61 kB).

### Breaking changes

- **`WidgetSize` enum removed.** `xs`/`sm`/`md`/`lg`/`xl` is no longer the
  scaling primitive. `ctx.size()` is gone. Widgets that previously gated on
  size should read `ctx.dimensions().width` / `.height` and apply pixel
  thresholds (e.g. `d.width <= 300` to replace `size === "xs" || size === "sm"`).
- **`WidgetOrientation` enum removed.** `ctx.orientation()` and
  `ctx.contentLayout()` are gone. CSS container queries on
  `.glasshome-widget` swap content layout direction automatically
  (`@container widget (min-aspect-ratio: 1) and (max-height: 149px)` flips
  the row layout). The `WidgetSliderFill` direction toggle is CSS-driven
  via `@container widget (max-aspect-ratio: 1)` and reads
  `--widget-fill-value`.
- **`WidgetDimensions` shape change.** No more `gridWidth` / `gridHeight`
  fields; just `{ width, height }` in raw CSS px.
- **`WidgetContextValue` removed.** Superseded by `ReactiveWidgetContext`
  (host RPC + edit mode + dimensions).
- **`BridgeableWidgetContext` and `BridgeFns` removed.** Hosts no longer
  need to provide a stub provider that the inner `<Widget>` writes into.
  Host `WidgetSlot` implementations should provide a plain
  `{ isEditMode, updateConfig, dimensions: () => ({ width: 0, height: 0 }) }`
  literal; the shell measures itself.
- **`SpacingScale` type removed.** Internal spacing tables (`S1`–`S4`) are
  gone from JS; gap and padding now flow through `--widget-gap` and
  `--widget-pad` CSS vars defined on the shell.
- **`useWidgetGestures` orientation argument is no-op.** The gesture
  library already runs its own size observer for `slide.orientation:
  "auto"`; callers should drop the second argument. The slide-orientation
  type alias is now internal to the gestures module.
- **Slot text CSS class contract.** `Widget.Title`, `Widget.Status`,
  `Widget.Value`, and badge nodes now render with SDK-owned classes
  (`.glasshome-widget-title`, `.glasshome-widget-status`,
  `.glasshome-widget-value`, `.glasshome-widget-badge`) and read scale from
  CSS vars. Tailwind text-size classes inside slot components are gone.
  Hosts that styled these elements via Tailwind utilities should switch
  to the CSS-var override path.
- **Pixel classifier deleted.** `classifySize`, `detectOrientation`,
  `detectContentLayout` private helpers and the `150 × 75` cell-size
  constants are removed.

### Removed (since 0.4.1)

- **Design system runtime tables.** `framework/design-system/spacing.ts` and
  `framework/design-system/typography.ts` deleted. Replaced by `clamp()`
  formulas and container-query rules on the shell in
  `framework/theming/tokens.css`.
- **`framework/types.ts` types.** `WidgetSize`, `WidgetOrientation`,
  `WidgetDimensions`, `WidgetContextValue`, `SpacingScale` removed from
  the file and from the public surface (`WidgetDimensions` re-defined in
  `hooks/use-widget-context.ts` with the new `{ width, height }` shape).
- **Bridgeable stub types.** `BridgeableWidgetContext` and `BridgeFns` no
  longer exported from `hooks/use-widget-context.ts` or the root entry.

### Added

- **CSS scale tokens on `.glasshome-widget`.** `--widget-icon-box`,
  `--widget-icon-glyph`, `--widget-pad`, `--widget-gap`,
  `--widget-title-size`, `--widget-subtitle`, `--widget-status-size`,
  `--widget-value-size`, `--widget-badge-size`. Each is
  `clamp(min, N·cqmin|cqi, max)` so widgets at the same rendered box
  match exactly while still scaling smoothly on resize. Host stylesheets
  can override these vars to retune density without touching JS.
- **`--widget-fill-value` channel.** `WidgetSliderFill` writes a single
  custom property (0–100). The shell's container query picks horizontal
  versus vertical clip-path direction.
- **`ctx.dimensions()` raw px accessor.** Backed by an internal
  `createElementSize` on the shell element. Widgets that need to branch
  rendered content (mount thumbnails on small, full controls on large,
  etc.) read this and apply their own pixel thresholds.

### Host migration notes

- `WidgetSlot`-style host components no longer need a bridgeable stub.
  Replace the bridge object with a plain `ReactiveWidgetContext` literal.
  The inner `<Widget>` measures itself via its own resize observer.
- Built-in widgets in this monorepo (`packages/public/widgets/`) have been
  updated in lockstep; external widgets that referenced `ctx.size()`,
  `ctx.orientation()`, or `ctx.contentLayout()` need the same edits.
- Widget manifest `sdkVersion` ranges should now include `^0.5.0`. The
  shared widget bundle peer-deps on `@glasshome/widget-sdk ^0.5.0`.

[0.5.0]: https://github.com/glasshome/widget-sdk/releases/tag/v0.5.0

## [0.4.1] - 2026-05-17

Dead-export trim. Files that are still used internally (variant system,
`cn`, `spacing`, `typography`, `WIDGET_Z`, `format-value`, `interpret-value`,
`entity-aggregation`, `empty-state` type, `to-form-schema`) remain in the
source tree but are no longer re-exported from the public package surface.
Bundle dropped from 70.56 kB to 50.74 kB (gzip 19.40 kB to 14.97 kB).

### Removed

- **Variant system public exports.** `builtInVariants`, `classicGlass`,
  `compactHorizontal`, `minimal`, `applyCssVars`, `applyLayout`,
  `composeVariants`, `createFlexLayout`, `extendVariant`, `getBuiltInVariant`,
  `getBuiltInVariantIds`, `isBuiltInVariant`, `mergeVariants`. The
  `framework/variants/` directory stays in-tree because `Widget.tsx` and three
  internal widgets still resolve `variant="classic-glass"` through it; the
  variants are simply no longer part of the published API.
- **Theming color palette.** `colors.ts` and its exports (`GRADIENT_NAMES`,
  `GRADIENT_PRESET_KEYS`, `GRADIENT_PRESETS`, `GradientPreset`, `getGradient`,
  `getGradientFromString`, `gradientColorPresets`, `stateColors`,
  `WidgetColorPreset`). The channel API (`tone`/`color`/`colorTo`/`gradient`)
  on `<Widget>` is the only supported color path.
- **Dead components.** `WidgetSubtitle`, `WidgetMetrics`, `WidgetEmptyState`
  component, `WidgetStack` layout, `Glow` background. `Widget.Subtitle`,
  `Widget.Metrics`, `Widget.EmptyState` compound members are detached from
  `Widget`. The `emptyState` prop on `<Widget>` still renders the inline
  empty-state UI.
- **Dead hooks.** `useDebugData`, `useWidgetConfig`, `useWidgetEntity`,
  `useWidgetForm`, `useWidgetResponsive`, plus their option/return types.
  `warnIfStub` is no longer exported (the helper itself is removed).
- **Dead utils.** `cn`, `formatValue`, `interpretValue`, `createEmptyStateConfig`
  and the `EmptyStateConfigOptions` / `WidgetEmptyStateConfig` types from
  the public surface; `isEntityAvailable`, `getEntityState`,
  `countEntitiesByState`, `countAvailableEntities`, `allEntitiesInState`,
  `anyEntityInState` removed entirely. `getEntityAttribute`,
  `isEntityActive`, `countActiveEntities` remain.
- **Design system exports.** `spacing`, `getSpacingClass`, `typography`,
  `WIDGET_Z`, `WidgetZIndex` un-exported. Files stay in-tree because internal
  components still consume them.
- **`createEntity` and `Entity` type.** The signal infrastructure was dead
  legacy from before the sync-layer port. Widgets read entities from
  `useWidgetEntityGroup` or `EntityView` props.
- **`getThemeToken`.** Only `isDark` remains in `theme.ts`.
- **Schema exports.** `PublishBodySchema`, `PublishConfirmSchema`,
  `PublishRequestSchema`, `GridSizeSchema`, `parseGridSize`,
  `serializeGridSize` removed from the root entry. The dedicated
  `@glasshome/widget-sdk/schemas` subpath still exports
  `WidgetManifestSchema` and `formatSchemaError`.
- **`toFormSchema` and `extractDefaults`.** Used internally by
  `define-widget.ts` and `WidgetDialog.tsx`; no longer part of the public
  surface (file stays in-tree).
- **Public type surface trim.** `AbsoluteLayoutStrategy`, `BaseComponentProps`,
  `CustomLayoutStrategy`, `ElementConfig`, `FlexLayoutStrategy`,
  `GestureConfig`, `GradientConfig`, `GridLayoutStrategy`, `HoldGestureConfig`,
  `ImageOverlay`, `InteractionConfig`, `LayoutStrategy`, `PositionConfig`,
  `SlideGestureConfig`, `SpacingScale`, `VariantPlugins`, `VariantRegistry`,
  `WidgetElement`, `WidgetVariant`, `AggregationPreset` (kept as it's still
  exported via hooks for `useWidgetEntityGroup`). `GradientConfig`,
  `ImageOverlay`, `BaseComponentProps`, `WidgetVariant` removed from the
  source file. The rest stay internal for `variants/`, `gestures/`,
  `design-system/`.

[0.4.1]: https://github.com/glasshome/widget-sdk/releases/tag/v0.4.1
[0.4.0]: https://github.com/glasshome/widget-sdk/releases/tag/v0.4.0

## [0.4.0] - 2026-05-17

The widget visual system release. A single CSS-var channel now drives icon color,
glow, and shell gradient across every widget. Tones encode meaning; the oklch
palette delivers low-opacity vibrancy; dark/light mode swaps at the root with no
widget-side authoring.

### Breaking changes

- **Removed `WidgetIcon` `glow` prop.** The icon glow is now driven by the channel
  via `--widget-glow-strength`. Authors who set `glow` on a per-icon basis must
  migrate to `<Widget tone="...">` or `<Widget color="...">` on the parent.
- **Removed `WidgetIcon` `dynamicColor` prop.** Dynamic color now flows through
  `<Widget.Icon color="...">` (the standard channel override path). The light
  widget's entity-derived bulb color is the reference migration.
- **Removed `ColorVariant` type export.** State-driven coloring goes through the
  tone enum (`"success" | "warning" | "danger" | "info" | "neutral" | "accent"`).
- **Removed `adaptive-color.ts` and its exports.** Per-mode adaptation is now
  handled by the envelope CSS vars (`--widget-grad-strength`,
  `--widget-glow-default`, `--widget-border-highlight`) defined at `:root` and
  `.dark`.
- **Removed `HVAC_MODE_COLORS` Tailwind class map.** Climate widget consumers
  must use `<Widget color colorTo>` with oklch values.
- **Trimmed public type surface.** Internal component `Props` interfaces
  (`GlowProps`, `WidgetSliderFillProps`, `WidgetContentProps`,
  `WidgetEmptyStateProps`, `WidgetIconProps`, `WidgetMetricsProps`,
  `WidgetMetricsComponent`, `WidgetMetricsItemProps`, `WidgetStatusProps`,
  `WidgetSubtitleProps`, `WidgetTitleProps`, `WidgetValueProps`,
  `WidgetEmptyStateConfig` (Widget.tsx duplicate), `WidgetProps`,
  `WidgetComponent`, `CursorDef`, `GestureHandlers` re-export from hooks,
  `WidgetStackProps`, `InjectTokensRoot`) are no longer exported. Consumers
  use the components via JSX, not by importing Props.

### Added

- **Channel API.** Four CSS variables flow through every Widget instance:
  `--widget-color`, `--widget-gradient`, `--widget-icon-color`,
  `--widget-glow-strength`. Authors set them via `<Widget tone>`, `<Widget color>`,
  `<Widget colorTo>`, `<Widget gradient>`, and `<Widget.Icon color>` props.
- **`injectTokens()` helper.** Injects the SDK tokens stylesheet into `<head>`
  with DOM and module-level idempotency guards. Wired into `Widget` `onMount`.
- **`ToneSchema` and `Tone` exports.** Zod schema + type for the six-tone
  semantic enum.
- **Retuned oklch tone palette.** Six tones (`success`, `warning`, `danger`,
  `info`, `neutral`, `accent`) tuned for vibrancy at 20% alpha in both modes.
- **Per-mode envelope variables.** `--widget-grad-strength`,
  `--widget-glow-default`, `--widget-border-highlight` differ between `:root`
  and `.dark` so widgets adapt without authoring `dark:` classes.
- **`@property --widget-color`.** Declared with `<color>` syntax and
  `inherits: true` so state-driven color transitions animate smoothly via CSS.
- **WidgetSliderFill channel wiring.** Slider stripe and glow read
  `var(--widget-color)` with `--widget-icon-color` as an optional override.

### Changed

- **Widget shell collapsed to a single `<div>`** with the gradient computed by
  a single SDK rule using `color-mix(in oklch, ...)` at asymmetric stops.
- **WidgetIcon rewritten** for channel consumption; previous `shadow-[...]`
  Tailwind arbitrary classes removed.
- **Glow migrated to channel.** No per-call color props.
- **Empty-state and loading states migrated off Tailwind** to channel-driven
  styling.
- **Mobile and desktop gesture grammars split.** Gestures bind on the Widget
  container with touch-action derived from gesture orientation.

### Fixed

- **`tokens.css?raw` type emit.** Added sibling ambient declaration plus a
  triple-slash reference in `tokens.ts` so downstream consumers compiling SDK
  source via the `@glasshome/source` customCondition resolve the `?raw` query
  at type-check time.
- **Auto-contrast icon glyph.** Removed the `text-foreground` fallback that
  caused incorrect glyph contrast on saturated channel backgrounds.
- **EntityView timestamps.** Reverted to `Date` for backward compat after a
  brief Date-to-string detour.
- **Cached widget rect.** `useWidgetGestures` reads from the ResizeObserver
  cache in `onPointerMove` rather than re-measuring (perf fix from Phase 01).
- **Widget Save button reactivity** and scrollbar gutter reservation in the
  config dialog.

### Removed

- `adaptive-color.ts` module and exports.
- `ColorVariant` type.
- `HVAC_MODE_COLORS` Tailwind class map.
- `WidgetIcon` `glow` and `dynamicColor` props.
- `src/framework/design-system/index.ts` barrel (dead, all consumers used direct file paths).
- `vite-plugin-externalize-deps` devDependency (never referenced by `vite.config.ts`).
