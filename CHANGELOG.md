# Changelog

All notable changes to `@glasshome/widget-sdk` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
