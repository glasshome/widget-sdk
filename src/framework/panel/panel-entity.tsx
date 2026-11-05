import { useEntity, useTemperatureUnit } from "@glasshome/sync-layer/solid";
import {
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  on,
  onCleanup,
  Show,
  useContext,
} from "solid-js";
import { useService } from "../hooks/use-service";
import { WidgetCtx } from "../hooks/use-widget-context";
import { PanelRow } from "./panel";

type Entity = NonNullable<ReturnType<ReturnType<typeof useEntity>>>;

/** A service on the entity's own domain, aimed at the entity. */
interface Call {
  service: string;
  data?: Record<string, unknown>;
}

interface Bounds {
  min: number;
  max: number;
  step?: number;
}

interface DomainRow {
  icon: string | ((e: Entity) => string);
  tone: string | ((e: Entity) => string);
  on: (e: Entity) => boolean;
  state: (e: Entity) => string;
  level?: (e: Entity) => number | undefined;
  /** The level's range; unset is 0 to 100 in whole steps. */
  bounds?: (e: Entity, unit: string) => Bounds;
  setLevel?: (e: Entity, value: number) => Call;
  tap?: (e: Entity) => Call;
}

// Long enough for Home Assistant to report the new value back, short enough that a refused call springs back.
const SETTLE_MS = 5000;
// Climate and water heater share the TARGET_TEMPERATURE bit.
const TARGET_TEMPERATURE = 1;
const VALVE_SET_POSITION = 4;

const num = (n: unknown) => (typeof n === "number" ? n : undefined);
const pct = (n: unknown) => (typeof n === "number" ? Math.round(n) : undefined);
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replaceAll("_", " ");
const supports = (e: Entity, bit: number) =>
  ((num(e.attributes.supported_features) ?? 0) & bit) > 0;
const fahrenheit = (e: Entity, unit: string) =>
  String(e.attributes.temperature_unit ?? unit).includes("F");

const setpoint = (e: Entity) =>
  supports(e, TARGET_TEMPERATURE) ? num(e.attributes.temperature) : undefined;
const setpointBounds =
  (fallbackStep: (e: Entity, unit: string) => number) => (e: Entity, unit: string) => ({
    min: num(e.attributes.min_temp) ?? 0,
    max: num(e.attributes.max_temp) ?? 100,
    step: num(e.attributes.target_temp_step) ?? fallbackStep(e, unit),
  });

const DOMAINS: Record<string, DomainRow> = {
  light: {
    icon: "mdi:lightbulb",
    tone: (e) => {
      const rgb = e.attributes.rgb_color;
      return Array.isArray(rgb) && rgb.length === 3
        ? `rgb(${rgb.join(" ")})`
        : "var(--tone-warning)";
    },
    on: (e) => e.state === "on",
    state: (e) => {
      if (e.state !== "on") return "Off";
      const b = e.attributes.brightness;
      return typeof b === "number" ? `${Math.round((b / 255) * 100)}%` : "On";
    },
    level: (e) => {
      const b = e.attributes.brightness;
      return e.state === "on" ? (typeof b === "number" ? Math.round((b / 255) * 100) : 100) : 0;
    },
    setLevel: (_e, v) =>
      v > 0 ? { service: "turn_on", data: { brightness_pct: v } } : { service: "turn_off" },
    tap: () => ({ service: "toggle" }),
  },
  switch: {
    icon: "mdi:toggle-switch-variant",
    tone: "var(--tone-info)",
    on: (e) => e.state === "on",
    state: (e) => (e.state === "on" ? "On" : "Off"),
    tap: () => ({ service: "toggle" }),
  },
  input_boolean: {
    icon: "mdi:toggle-switch-variant",
    tone: "var(--tone-info)",
    on: (e) => e.state === "on",
    state: (e) => (e.state === "on" ? "On" : "Off"),
    tap: () => ({ service: "toggle" }),
  },
  fan: {
    icon: "mdi:fan",
    tone: "var(--tone-success)",
    on: (e) => e.state === "on",
    state: (e) => {
      if (e.state !== "on") return "Off";
      const p = pct(e.attributes.percentage);
      return p === undefined ? "On" : `${p}%`;
    },
    level: (e) => (e.state === "on" ? (pct(e.attributes.percentage) ?? 100) : 0),
    setLevel: (_e, v) => ({ service: "set_percentage", data: { percentage: v } }),
    tap: () => ({ service: "toggle" }),
  },
  cover: {
    icon: "mdi:blinds",
    tone: "var(--tone-info)",
    on: (e) => e.state !== "closed",
    state: (e) => {
      const p = pct(e.attributes.current_position);
      const word = titleCase(e.state);
      return p !== undefined && e.state === "open" ? `${word} · ${p}%` : word;
    },
    level: (e) => pct(e.attributes.current_position),
    setLevel: (_e, v) => ({ service: "set_cover_position", data: { position: v } }),
    tap: (e) => ({ service: e.state === "closed" ? "open_cover" : "close_cover" }),
  },
  valve: {
    icon: "mdi:valve",
    tone: "var(--tone-info)",
    on: (e) => e.state !== "closed",
    state: (e) => {
      const p = pct(e.attributes.current_position);
      const word = titleCase(e.state);
      return p !== undefined && e.state === "open" ? `${word} · ${p}%` : word;
    },
    level: (e) =>
      supports(e, VALVE_SET_POSITION) ? pct(e.attributes.current_position) : undefined,
    setLevel: (_e, v) => ({ service: "set_valve_position", data: { position: v } }),
    tap: (e) => ({ service: e.state === "closed" ? "open_valve" : "close_valve" }),
  },
  lock: {
    icon: (e) => (e.state === "locked" ? "mdi:lock" : "mdi:lock-open-variant"),
    tone: "var(--tone-success)",
    on: (e) => e.state === "locked",
    state: (e) => titleCase(e.state),
    tap: (e) => ({ service: e.state === "locked" ? "unlock" : "lock" }),
  },
  // No tap: a tap that turns the heating off is a trap. Power lives in the thermostat's modes.
  climate: {
    icon: "mdi:thermostat",
    tone: "var(--tone-danger)",
    on: (e) => e.state !== "off",
    state: (e) => {
      if (e.state === "off") return "Off";
      const t = e.attributes.temperature;
      return typeof t === "number" ? `${titleCase(e.state)} · ${t}°` : titleCase(e.state);
    },
    level: setpoint,
    bounds: setpointBounds((e, unit) => (fahrenheit(e, unit) ? 1 : 0.5)),
    setLevel: (_e, v) => ({ service: "set_temperature", data: { temperature: v } }),
  },
  water_heater: {
    icon: "mdi:water-boiler",
    tone: "var(--tone-danger)",
    on: (e) => e.state !== "off",
    state: (e) => {
      if (e.state === "off") return "Off";
      const t = e.attributes.temperature;
      return typeof t === "number" ? `${titleCase(e.state)} · ${t}°` : titleCase(e.state);
    },
    level: setpoint,
    bounds: setpointBounds(() => 1),
    setLevel: (_e, v) => ({ service: "set_temperature", data: { temperature: v } }),
  },
  humidifier: {
    icon: "mdi:air-humidifier",
    tone: "var(--tone-info)",
    on: (e) => e.state === "on",
    state: (e) => {
      if (e.state !== "on") return "Off";
      const h = pct(e.attributes.humidity);
      return h === undefined ? "On" : `${h}%`;
    },
    level: (e) => pct(e.attributes.humidity),
    bounds: (e) => ({
      min: num(e.attributes.min_humidity) ?? 0,
      max: num(e.attributes.max_humidity) ?? 100,
    }),
    setLevel: (_e, v) => ({ service: "set_humidity", data: { humidity: v } }),
    tap: () => ({ service: "toggle" }),
  },
  media_player: {
    icon: "mdi:speaker",
    tone: "var(--tone-accent)",
    on: (e) => e.state === "playing",
    state: (e) =>
      typeof e.attributes.media_title === "string" && e.state !== "off"
        ? e.attributes.media_title
        : titleCase(e.state),
    level: (e) =>
      typeof e.attributes.volume_level === "number"
        ? Math.round(e.attributes.volume_level * 100)
        : undefined,
    setLevel: (_e, v) => ({ service: "volume_set", data: { volume_level: v / 100 } }),
    tap: () => ({ service: "media_play_pause" }),
  },
  binary_sensor: {
    icon: "mdi:eye",
    tone: "var(--tone-info)",
    on: (e) => e.state === "on",
    state: (e) => {
      const words = BINARY_WORDS[e.deviceClass ?? ""] ?? ["On", "Off"];
      return e.state === "on" ? words[0] : words[1];
    },
  },
  button: {
    icon: "mdi:gesture-tap-button",
    tone: "var(--tone-accent)",
    on: () => false,
    state: (e) => pressedAt(e.state),
    tap: () => ({ service: "press" }),
  },
  input_button: {
    icon: "mdi:gesture-tap-button",
    tone: "var(--tone-accent)",
    on: () => false,
    state: (e) => pressedAt(e.state),
    tap: () => ({ service: "press" }),
  },
  scene: {
    icon: "mdi:palette",
    tone: "var(--tone-accent)",
    on: () => false,
    state: () => "Tap to run",
    tap: () => ({ service: "turn_on" }),
  },
  script: {
    icon: "mdi:script-text",
    tone: "var(--tone-accent)",
    on: (e) => e.state === "on",
    state: (e) => (e.state === "on" ? "Running" : "Tap to run"),
    tap: () => ({ service: "turn_on" }),
  },
};

const COVER_ICON: Record<string, string> = {
  garage: "mdi:garage",
  gate: "mdi:gate",
  door: "mdi:door",
  curtain: "mdi:curtains",
  shutter: "mdi:window-shutter",
  awning: "mdi:awning",
};

const BINARY_WORDS: Record<string, [string, string]> = {
  door: ["Open", "Closed"],
  window: ["Open", "Closed"],
  garage_door: ["Open", "Closed"],
  opening: ["Open", "Closed"],
  motion: ["Detected", "Clear"],
  occupancy: ["Detected", "Clear"],
  presence: ["Home", "Away"],
  moisture: ["Wet", "Dry"],
  smoke: ["Smoke", "Clear"],
  lock: ["Unlocked", "Locked"],
  battery: ["Low", "Normal"],
  connectivity: ["Connected", "Disconnected"],
};

/** A button's state is when it was last pressed. */
function pressedAt(state: string): string {
  const t = Date.parse(state);
  if (Number.isNaN(t)) return "Never pressed";
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const FALLBACK: DomainRow = {
  icon: "mdi:circle-medium",
  tone: "var(--tone-neutral)",
  on: (e) => e.state === "on",
  state: (e) => titleCase(e.state),
};

const WHOLE: Bounds = { min: 0, max: 100 };

/** "Living Room Thermostat" in the Living Room reads "Thermostat". */
function trimPlace(name: string, place: string | undefined): string {
  if (!place || name.length <= place.length) return name;
  if (!name.toLowerCase().startsWith(place.toLowerCase())) return name;
  const rest = name.slice(place.length).trim();
  return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : name;
}

/** Whether a domain has a row with something to press (sensors read as facts instead). */
export function isPanelControllable(domain: string): boolean {
  return !!DOMAINS[domain]?.tap || !!DOMAINS[domain]?.setLevel;
}

/**
 * A row for any entity, drawn and wired from its domain: a light dims, a cover
 * opens, a lock locks. The same row the area panel and every group panel use.
 * A call the widget's grant refuses draws no control; the row still reads.
 */
export function PanelEntityRow(props: {
  entityId: string;
  /** Overrides the entity's own name ("Ceiling" instead of "Living room ceiling"). */
  name?: string;
  /** A place the panel already names; dropped from the front of the entity's name. */
  within?: string;
  /** Overrides the domain's icon and tone, so a row matches the widget it sits in. */
  icon?: string;
  tone?: string;
  onHold?: () => void;
}): JSX.Element {
  const entity = useEntity(() => props.entityId);
  const unit = useTemperatureUnit();
  const { callService } = useService();
  const canCall = useContext(WidgetCtx)?.canCall;
  // The value a drag set, shown until the entity reports it or SETTLE_MS passes.
  const [pending, setPending] = createSignal<number | undefined>();
  let settle: ReturnType<typeof setTimeout> | undefined;
  const hold = (value: number | undefined) => {
    clearTimeout(settle);
    setPending(value);
    if (value !== undefined) settle = setTimeout(() => setPending(undefined), SETTLE_MS);
  };
  createEffect(
    on(
      () => props.entityId,
      () => hold(undefined),
      { defer: true },
    ),
  );
  onCleanup(() => clearTimeout(settle));
  return (
    <Show when={entity()}>
      {(e) => {
        const d = () => DOMAINS[e().domain] ?? FALLBACK;
        const reported = () => d().level?.(e());
        createEffect(() => {
          if (pending() !== undefined && reported() === pending()) hold(undefined);
        });
        const level = () => pending() ?? reported();
        const bounds = createMemo(() => d().bounds?.(e(), unit()) ?? WHOLE);
        const allowed = (call: Call) => canCall?.(e().domain, call.service, [e().id]) ?? true;
        const run = (call: Call) =>
          void callService(e().domain, call.service, call.data ?? {}, { entity_id: e().id });
        // Asked once per entity change, never per pointer move: in a sealed realm each ask crosses to the host.
        const tap = createMemo(() => {
          const t = d().tap?.(e());
          return t && allowed(t) ? t : undefined;
        });
        const setLevel = createMemo(() => {
          const set = d().setLevel;
          const b = bounds();
          return set && allowed(set(e(), b.min)) && allowed(set(e(), b.max)) ? set : undefined;
        });
        const isOn = () => d().on(e());
        const slide = createMemo(() => {
          const set = setLevel();
          const v = level();
          if (!set || v === undefined) return undefined;
          return {
            value: v,
            ...bounds(),
            onChange: hold,
            onCommit: (next: number) => {
              hold(next);
              run(set(e(), next));
            },
          };
        });
        return (
          <PanelRow
            icon={(() => {
              const own = d().icon;
              // A state-drawn icon (an open lock) outranks the entity's resting default.
              if (typeof own === "function") return props.icon ?? own(e());
              return (
                props.icon ??
                e().icon ??
                COVER_ICON[e().domain === "cover" ? (e().deviceClass ?? "") : ""] ??
                own
              );
            })()}
            name={props.name ?? trimPlace(e().friendlyName ?? e().id, props.within)}
            state={d().state(e())}
            tone={(() => {
              if (props.tone) return props.tone;
              const t = d().tone;
              return typeof t === "function" ? t(e()) : t;
            })()}
            on={isOn()}
            slide={slide()}
            fill={(() => {
              const v = level();
              if (setLevel() || !d().setLevel || v === undefined || !isOn()) return undefined;
              const b = bounds();
              return ((v - b.min) / (b.max - b.min || 1)) * 100;
            })()}
            onTap={(() => {
              const t = tap();
              return t ? () => run(t) : undefined;
            })()}
            onHold={props.onHold}
          />
        );
      }}
    </Show>
  );
}
