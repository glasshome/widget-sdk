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

Render `<WidgetDialog>` next to `<Widget>`, spreading the dialog parts (`ResponsiveDialog*`, `Button`, `SchemaForm`, `Tabs*`, see the scaffold) and `useWidgetDialog().dialogProps`. Hold opens the sheet on its own once `sheet` is passed; no gesture wiring. Only what the tile lacks (group members, colours, modes, forecast). Pass `sheet` only when there is something: `{...(extras() ? { sheet: () => <MySheet /> } : {})}`. Build from `PanelSection`, `PanelRows`, `PanelRow`, `PanelEntityRow`, `PanelFacts`, `ToggleGroup`, `SwatchPicker`, `TemperatureBar`, `ColorDisc`. Never repeat the tile's value, name or art. Widget CSS does not reach it. A recently held sheet stays mounted between opens, keeping its state and scroll: a ticker inside it pauses while `useSheetDormant()` is true.

## Primitives

`Badge`, `Button`, `ButtonGroup`, `CountPill`, `Icon`, `Input`, `Label`, `Progress`, `SchemaForm`, `SectionIcon`, `SectionTitle`, `Select`, `Slider`, `Switch`, `Tabs`, `Toggle`, `ToggleGroup`, `Carousel`, `ColorWheel`, `ColorSlider`, `ResponsiveDialog` + parts. `Icon`, never `iconify-icon`. Never restyle with own classes.

## Rules

- No hand-rolling what the SDK has: sliders, steppers, dialogs, sheets, hold gestures, loading/error states.
- Theme vars only (`--foreground`, `--muted-foreground`, `--card`, `--primary`, `--border`, `--success`, `--warning`, `--destructive`, `--radius`). Never declare them on `:host`; no own colour/radius tokens; no `--color-*`.
- Material: a part you draw follows the home's material through `--material-*` (`--material-accent`, `--material-face`, `--material-well`, `--material-raised`, `--material-pressed`, `--material-control-track|fill|knob`, `--material-blur`, `--material-clarity`, `--material-tint`, `--material-glow`) and its own color through `--surface-tone`, `--surface-wash`. `useMaterial()` to decide (`terms.face`, `terms.glow`), never to paint. Never read `--glass-*` or `--_*`; the build warns, and names the retired `--material-*` ones.
- Own CSS = layout and bespoke art. No custom panel/row/chip/button chrome.
- Tailwind classes literal in source, never concatenated.
- Dark mode: style with `dark:` and theme vars, which follow the home everywhere. `isDark()` for logic, reactive in a memo or effect. `prefers-color-scheme` is the device's setting, not the home's mode.
- No dot status lamps. No thin vertical bars (read as a text caret). No all-caps. Separator ` · `.
- One icon per item, not per line. Icons, fills and pictures before text.
- Lead with the answer (value + unit, or a verdict); one small line explains it. Never show a value twice. States per device class (Open/Closed, Detected/Clear).
- Continuous values keep the full-tile slider; buttons beside it. A stepper never stands alone.
- Dialog content scrolls in `ResponsiveDialogBody`; no own `overflow`/`max-height` in a dialog.
- Groups: one tap brings all members to one state; locks never unlock in one tap; doors, gates, garage doors never join bulk actions.
- Readings update text in place; never rebuild DOM. `Index` for lists of readings. Over 20 s of changing demo data a widget adds and removes no DOM nodes.
- Everything sits on an edge; text left, values/actions right. One accent per view; defaults quiet. No card in a card.
- Motion: colours morph, never snap; time transitions with `--duration-state` / `--ease-morph` (zeroed under reduced motion). Decorative loops scale by `var(--motion-ambient, 0)`. Gate on `useReducedMotion()` (the device's setting or the home's Reduce motion); pause offscreen with `useIntersectionPause()`.

## Sealed engine

Dash 1.5 previews the engine every widget will run in: QuickJS, no page access. Test there before publishing: Settings, Developer Mode, Sealed widgets (preview), reload, then `bun widget connect`. `bun widget preview` still renders in the page, so it does not prove a widget runs sealed.

- Import only `@glasshome/widget-sdk` and `solid-js` (`/store`, `/web`).
- No `fetch`, `XMLHttpRequest`, WebSocket, cookies, Capacitor. `localStorage` and `sessionStorage` are in memory, one pair per widget (every copy of a widget shares it), and empty on reload. They keep widgets apart but are no security boundary: widgets in one engine share its memory. Module top-level code uses its widget's store; a timer or listener set up there runs for no widget, so storage throws a catchable SecurityError in it and the engine runs on. Keep what must last with `useWidgetState(key, schema, fallback)`: for this widget on its board and this person, kept by the host (8 KB a value, 32 keys); config stays for settings the homeowner chooses. Built-ins are frozen: no `z.config`, no global patches.
- DOM is mirrored through an allowlist: no `<style>`, `<link>`, `<script>`, no `el.click()`; images only `data:image/…`, same-origin `blob:` or `/ha-proxy/media`.
- Limits: CPU 250 ms per second, setup 1.5 s per 10 s (both stop the widget until the homeowner turns it back on), 500 ms per run and 256 MB (both crash it), 20,000 elements, 512 timers, 128 observers.
- Refusals and CPU use: Settings > Sealed widgets (Developer Mode). Each refusal has a sentence and a code; fix every one.

Full page: https://glasshome.app/md/widgets/widget-sealed-engine.

## Translations

Words in a widget go through the SDK so each member reads their own language.

- `locales/en.json` is a flat object of key to message. Keys: lowercase words, `-` or `_` inside a word, `.` between groups; never `manifest.*`. Plurals: `{count, plural, one {# light} other {# lights}}`, `other` always present.
- `import en from "./locales/en.json"`, then `defineWidget({ manifest, component, messages: en })`. The build compiles it; no parser ships.
- `const { t, formatNumber, formatDate, formatRelative, formatTemperature, translateState, language, locale } = useTranslation()`. `t` also exists bare for rendering; use the hook's `t` in handlers and after `await`. `t("key", { count: 3 })` falls back to the English, then to the key.
- `formatTemperature(value, { unit?, digits? })` writes the unit given, never converts. `translateState(entity, { attribute?, value? })` is Home Assistant's word for a state in the member's language.
- Formatted text is for display only: never `parseFloat` it, never send it to `callService` (the types refuse it). Send the raw number.
- No bare `toLocaleString()`, `new Intl.NumberFormat()` or `localeCompare()` without a locale; the build warns. Use the helpers, or pass `locale()`.
- `manifest.name`, `manifest.description`, `manifest.examples.N.label` and `manifest.config.*` are added to the English catalog by the build; never write them in `en.json`. A `fr.json` may carry a translated `manifest.name`.
- Other languages: `fr.json`, `es.json`, `de.json` beside `en.json`. `bun widget validate` checks parsing, every literal `t("key")` against `en.json`, and stray keys. `bun widget connect` pushes the catalogs to the local dash.

Full page: https://glasshome.app/md/widgets/widget-translations.

## More

Docs as markdown: https://glasshome.app/llms.txt, `https://glasshome.app/md/widgets/<page>` (`widget-sheets`, `widget-styling`, `widget-sdk`, `widget-sdk/materials`, `widget-api-reference`, `widget-capabilities`, `widget-previews`). Official widgets as worked examples: https://github.com/glasshome/widgets (`src/button`, `src/sensor`); where they differ from this guide, the guide wins.
