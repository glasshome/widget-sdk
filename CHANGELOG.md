# Changelog

All notable changes to `@glasshome/widget-sdk` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.4.0]: https://github.com/glasshome/widget-sdk/releases/tag/v0.4.0
