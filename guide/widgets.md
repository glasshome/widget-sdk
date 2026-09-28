# Building a GlassHome widget

This guide ships inside `@glasshome/widget-sdk` and matches the SDK version installed next to it. Upgrading the SDK (`bun widget upgrade`) upgrades this guide. When this guide and a blog post, an old example or your memory disagree, this guide wins.

A widget should be indistinguishable from an official one: same parts, same scale, same glass, same motion. Everything below exists to keep it that way.

## Before writing code

1. Name each surface the widget needs (the reading, the icon, each control, what the sheet holds).
2. Resolve each one to an SDK export from the tables below, and write the mapping down (one line per surface).
3. A surface nothing covers is written `NEW: <what is missing>`. Draw it yourself as bespoke art, and tell the widget's author it is a gap worth asking GlassHome for.

## Imports

- Import everything from `@glasshome/widget-sdk`. UI primitives included: `import { Button, ToggleGroup } from "@glasshome/widget-sdk"`.
- Never import `@glasshome/ui` or `@glasshome/ui/solid`. The SDK re-export is the one the dashboard checks against `sdkVersion`; a direct import can meet a ui version it was never built against and leaves a dead tile. Keep `@glasshome/ui` installed: the build reads its styles.
- Never import `@glasshome/sync-layer`. Its hooks come through the SDK (`useEntity`, `useEntities`, `useService`, `useToggle`, …); a direct import bundles a second, disconnected store.
- Read Home Assistant only through SDK hooks, never `window` or `document` globals, and declare every domain you read or control in the manifest's capabilities.

## The tile

Build the tile from the `Widget` parts inside `Widget.Content`. Each part hides, shrinks or moves as the tile changes size; never measure the tile to lay it out.

| Need | Part |
|---|---|
| The tile | `Widget` (colour via `tone` or `color`, gestures, `confirmed`) with `Widget.Content` inside |
| Icon, name, small line above it, chips | `Widget.Head` (`icon`, `eyebrow`, `name`, `active`, `count`, `aside`) |
| The big reading with its unit and art | `Widget.Hero` (`value`, `unit`, `sub`, `art`) |
| Control row | `Widget.Controls` |
| Minus and plus next to other controls | `Widget.Stepper` |
| A row of icon options | `Widget.Choice` |
| Something that leaves no state (run, press, stop) | `Widget.Action`; share `useConfirm()` when the whole tile runs it |
| A small fact in the head | `Widget.Chip` |
| A photo behind the whole tile | `Widget.Backdrop` |
| Your own full-bleed layer (scene, chart band) | `Widget.Layer` |
| The faint corner icon | `Widget.Glyph` |
| A continuous value (brightness, volume, position) | `Widget.SliderFill`; buttons sit beside it, never instead of it |

Colour: `tone` is one of `"accent" | "info" | "success" | "warning" | "danger" | "neutral"`. Everything coloured reads `--widget-color`. Use `accent` on `Widget.Content` for a colour that follows state (a lamp's own colour).

## Sizes

Tiles go from 1×1 to 8×8. Size your own content with the scale tokens, never pixels:

| Token | For |
|---|---|
| `--widget-text-value` | A big reading |
| `--widget-text-name` | A name |
| `--widget-text-meta` | A small line above a name |
| `--widget-text-sub` | A small line next to a reading; labels |
| `--widget-text-caption` | Axis ticks, list rows |
| `--widget-control-h` | A control's height |
| `--widget-grid-pad`, `--widget-grid-gap` | Spacing inside the tile |
| `--widget-icon-box`, `--widget-icon-glyph` | The head icon |

Layout changes by size use container queries on the `widget` container (`@[150px]:text-4xl`, or `@container widget (...)` in CSS). To change *what* renders, read `useWidgetDimensions()` inside `<Widget>`.

## The sheet

Holding a tile opens its sheet: only what the tile has no room for (each light of a group, colours, modes, sources, the days ahead). Pass `sheet` (a render function) to `WidgetDialog`, and only when there is something extra; a widget with nothing extra passes no sheet.

- Build it from `PanelSection`, `PanelRows`, `PanelRow`, `PanelEntityRow` and `PanelFacts`, with `ToggleGroup` for choices and `SwatchPicker`, `TemperatureBar`, `ColorDisc` for colour.
- Never draw the tile again in the sheet: no art, no big value, no repeated name or state.
- The sheet renders outside the widget's shadow root, so your CSS never reaches it. Style it only through those parts.

## UI primitives

Available from the SDK: `Badge`, `Button`, `ButtonGroup`, `CountPill`, `Icon`, `Input`, `Label`, `Progress`, `SchemaForm`, `SectionIcon`, `SectionTitle`, `Select` (+ parts), `Slider`, `Switch`, `Tabs` (+ parts), `Toggle`, `ToggleGroup`, `ToggleGroupItem`, `Carousel` (+ parts), `ColorDisc`, `ColorSlider`, `ColorWheel`, `SwatchPicker`, `TemperatureBar`, `ResponsiveDialog` (+ parts). Use `Icon` for icons, never the `iconify-icon` element.

They carry the glass material and follow the homeowner's theme live. Never restyle one with your own classes; if none fits, it is a `NEW:` line.

## Styling

- Colours, radii and motion come from the theme's variables: `--foreground`, `--muted-foreground`, `--card`, `--primary`, `--border`, `--muted`, `--accent`, `--success`, `--warning`, `--destructive`, `--radius`. They inherit into your shadow root and change live with the theme.
- Never declare a theme variable on `:host` (the build fails) and never invent your own colour or radius tokens. `--widget-*` variables for your own layout are fine.
- `--color-*` aliases do not exist inside a widget.
- Your own CSS is layout and bespoke art only (a drawing, a chart, a scene). Panel, row, chip and button chrome comes from the parts and primitives.
- Tailwind classes must appear literally in source; never build class names by string concatenation.
- `dark:` variants work; for the boolean use `isDark()`.

## Words

- Lead with the answer: one number with its unit, or a short verdict ("Locked", "Good time"). The small line explains it ("Now 21.8°C").
- Never show a value twice on one tile.
- States follow the device class: a door is Open or Closed, motion is Detected or Clear.
- No all-caps. Separator ` · `.

## Composition

A homeowner arrives with one question and hunts for the answer.

- Every element sits on an edge of its surface or of a neighbour. Text leads left, values and actions trail right. Centre only what nobody needs to read.
- Emphasis is contrast: a value at its default is quiet (`--muted-foreground`); the one that changed earns the colour. One accent per view.
- Show before you tell: a state is a `Badge`, a level a fill, a thing its icon. A tooltip or helper line is the last resort, and touch has no hover.
- No card inside a card, no glass surface inside the sheet or a dialog.

## Motion

- Colours morph on state change, never snap. Shapes grow out of what opened them.
- A new reading updates text in place and never rebuilds the DOM; use `Index` for lists that update with readings.
- Decorative loops are ambient: multiply their duration by `var(--motion-ambient, 0)` so an idle wall tablet draws nothing. Pause off-screen work with `useIntersectionPause()`.
- Gate non-essential animation on `useReducedMotion()`.

## Checking your work

1. `bun widget build` (it typechecks and validates).
2. `bun widget preview <widget> --sizes grid` renders every example across common sizes, light and dark, into `preview/`. Look at the pictures: a 1×1, a 2×2 and a big tile, in both themes.
3. `bun widget connect <url>` to see it live on a dashboard.

## Reference

- Full docs, as markdown: https://glasshome.app/llms.txt (index) and https://glasshome.app/md/widgets/widget-sheets, `/md/widgets/widget-styling`, `/md/widgets/widget-sdk`, `/md/widgets/widget-api-reference`, `/md/widgets/widget-capabilities`.
- How the official widgets look and why: https://github.com/glasshome/widgets/blob/main/DESIGN.md
- The design system's composition and motion rules: https://github.com/glasshome/ui/blob/main/SPEC.md

The live docs describe the newest SDK. If they name something this project's SDK does not export, run `bun widget upgrade` before using it.
