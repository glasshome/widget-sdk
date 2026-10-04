# GlassHome widgets

Matches the installed `@glasshome/widget-sdk`. Wins over memory and older docs.

## Loop

1. `bun widget add --name <name>`: `src/<name>/` with a working sensor tile (`index.tsx`, `manifest.json`). Start from it.
2. Write it. `examples` in `defineWidget` (label, size, config) are what preview renders. Demo entity ids: `node_modules/@glasshome/sync-layer/dist/demo/ids.d.ts`; a wrong id renders the empty state. Missing a kind of entity: use a stand-in and config to show each state.
3. `bun widget build`: typecheck, bundle, validate. Fix every error before previewing.
4. `bun widget preview <name> --sizes grid`: every example at common tile sizes, light and dark, into `preview/sweep/` with a contact sheet each. Open the images and look. First run: `bun add -d playwright && bunx playwright install chromium`. A crash fails the render with its error.
   - Narrow: `--sizes 150x156,340x242`, `--theme dark`, `--example 0`.
   - Change state: `--config '<json>'`, `--service '<domain.service>|<entity_id>|<json>'`, `--at 2026-06-15T21:00:00`, `--click '<selector>'`.
   - Inspect: `--eval '<expr>'` prints per render (`root` = shadow root).
5. Repeat 3-4 until 1×1, 2×2 and a big tile read right in both themes.
6. Live: `bun widget connect <dashboard-url>`.
7. Ship: `bun widget publish --name <name> --bump patch|minor|major`. Version lives in `manifest.json`.

## Imports

- Everything from `@glasshome/widget-sdk`, UI primitives included.
- Never `@glasshome/ui` (unchecked version, dead tile on mismatch) or `@glasshome/sync-layer` (second store). Keep `@glasshome/ui` installed; the build reads its CSS.
- Home Assistant only via SDK hooks (`useEntity`, `useEntities`, `useService`, `useToggle`, …). Declare every read/controlled domain in manifest capabilities.
- SDK too old for something in the docs: `bun widget upgrade`.
- Edit the inline `manifest` in `defineWidget`; build copies it into `manifest.json` (name, icon, sizes, capabilities, examples, schema). `version` and `sdkVersion` live only in `manifest.json`.
- Config: `defineConfig` + `field.*`. `field.entity(domain)` stores a one-item array: read `config.entityIds[0]`.

## Tile

Parts inside `Widget.Content`; they lay out and resize themselves. Never measure to lay out.

| Need | Part |
|---|---|
| Colour | `tone` (`accent info success warning danger neutral`) or `color` on `Widget`; `accent` on `Widget.Content` for state colour |
| Icon, name, eyebrow, chips | `Widget.Head` (`active`, `count`, `aside`) |
| Big value, unit, art | `Widget.Hero` |
| Control row | `Widget.Controls` with `Widget.Stepper`, `Widget.Choice`, `Widget.Action` |
| Stateless action | `Widget.Action`; `useConfirm()` + `<Widget confirmed>` when the whole tile runs it |
| Small fact | `Widget.Chip` |
| Photo behind tile | `Widget.Backdrop` |
| Own full-bleed layer | `Widget.Layer` |
| Faint corner icon | `Widget.Glyph` |
| Controllable continuous value | `Widget.SliderFill` |

## Sizes

1×1 to 8×8. Under 130px tall or 140px wide the tile is compact: `eyebrow` and `sub` hide, so carry state in `tone` and the icon. Tokens, never px: `--widget-text-value`, `--widget-text-name`, `--widget-text-meta`, `--widget-text-sub`, `--widget-text-caption`, `--widget-control-h`, `--widget-grid-pad`, `--widget-grid-gap`, `--widget-icon-box`, `--widget-icon-glyph`. Layout by container query (`@[150px]:…`, `@container widget (…)`). What renders by `useWidgetDimensions()`, inside `<Widget>` only.

## Sheet

Render `<WidgetDialog>` next to `<Widget>`, spreading the dialog parts (`ResponsiveDialog*`, `Button`, `SchemaForm`, `Tabs*`, see the scaffold) and `useWidgetDialog().dialogProps`. Hold opens the sheet on its own once `sheet` is passed; no gesture wiring. Only what the tile lacks (group members, colours, modes, forecast). Pass `sheet` only when there is something: `{...(extras() ? { sheet: () => <MySheet /> } : {})}`. Build from `PanelSection`, `PanelRows`, `PanelRow`, `PanelEntityRow`, `PanelFacts`, `ToggleGroup`, `SwatchPicker`, `TemperatureBar`, `ColorDisc`. Never repeat the tile's value, name or art. Widget CSS does not reach it.

## Primitives

`Badge`, `Button`, `ButtonGroup`, `CountPill`, `Icon`, `Input`, `Label`, `Progress`, `SchemaForm`, `SectionIcon`, `SectionTitle`, `Select`, `Slider`, `Switch`, `Tabs`, `Toggle`, `ToggleGroup`, `Carousel`, `ColorWheel`, `ColorSlider`, `ResponsiveDialog` + parts. `Icon`, never `iconify-icon`. Never restyle with own classes.

## Rules

- No hand-rolling what the SDK has: sliders, steppers, dialogs, sheets, hold gestures, loading/error states.
- Theme vars only (`--foreground`, `--muted-foreground`, `--card`, `--primary`, `--border`, `--success`, `--warning`, `--destructive`, `--radius`). Never declare them on `:host`; no own colour/radius tokens; no `--color-*`.
- Material: a part you draw follows the home's material through the `--surface-*` variables (`--surface-accent`, `--surface-face`, `--surface-well`, `--surface-raised`, `--surface-pressed`, `--surface-control-track|fill|knob`, `--surface-tone`, `--surface-wash`). `useMaterial()` to decide (`terms.face`, `terms.glow`), never to paint. Never read `--glass-*` or `--material-*`; the build warns.
- Own CSS = layout and bespoke art. No custom panel/row/chip/button chrome.
- Tailwind classes literal in source, never concatenated. `dark:` works; `isDark()` for the boolean.
- No dot status lamps. No thin vertical bars (read as a text caret). No all-caps. Separator ` · `.
- One icon per item, not per line. Icons, fills and pictures before text.
- Lead with the answer (value + unit, or a verdict); one small line explains it. Never show a value twice. States per device class (Open/Closed, Detected/Clear).
- Continuous values keep the full-tile slider; buttons beside it. A stepper never stands alone.
- Dialog content scrolls in `ResponsiveDialogBody`; no own `overflow`/`max-height` in a dialog.
- Groups: one tap brings all members to one state; locks never unlock in one tap; doors, gates, garage doors never join bulk actions.
- Readings update text in place; never rebuild DOM. `Index` for lists of readings. Over 20 s of changing demo data a widget adds and removes no DOM nodes.
- Everything sits on an edge; text left, values/actions right. One accent per view; defaults quiet. No card in a card.
- Motion: colours morph, never snap; time transitions with `--duration-state` / `--ease-morph` (zeroed under reduced motion). Decorative loops scale by `var(--motion-ambient, 0)`. Gate on `useReducedMotion()`; pause offscreen with `useIntersectionPause()`.

## More

Docs as markdown: https://glasshome.app/llms.txt, `https://glasshome.app/md/widgets/<page>` (`widget-sheets`, `widget-styling`, `widget-sdk`, `widget-sdk/materials`, `widget-api-reference`, `widget-capabilities`, `widget-previews`). Official widgets as worked examples: https://github.com/glasshome/widgets (`src/button`, `src/sensor`); where they differ from this guide, the guide wins.
