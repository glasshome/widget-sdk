import { useEntity } from "@glasshome/sync-layer/solid";
import { createEffect, createSignal, type JSX, Show } from "solid-js";
import { useService } from "../hooks/use-service";
import { PanelRow } from "./panel";

type Entity = NonNullable<ReturnType<ReturnType<typeof useEntity>>>;
type CallService = ReturnType<typeof useService>["callService"];

interface DomainRow {
  icon: string | ((e: Entity) => string);
  tone: string | ((e: Entity) => string);
  on: (e: Entity) => boolean;
  state: (e: Entity) => string;
  level?: (e: Entity) => number | undefined;
  setLevel?: (call: CallService, e: Entity, value: number) => void;
  tap?: (call: CallService, e: Entity) => void;
}

const pct = (n: unknown) => (typeof n === "number" ? Math.round(n) : undefined);
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replaceAll("_", " ");
const target = (e: Entity) => ({ entity_id: e.id });

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
    setLevel: (call, e, v) =>
      call("light", v > 0 ? "turn_on" : "turn_off", v > 0 ? { brightness_pct: v } : {}, target(e)),
    tap: (call, e) => call("light", "toggle", {}, target(e)),
  },
  switch: {
    icon: "mdi:toggle-switch-variant",
    tone: "var(--tone-info)",
    on: (e) => e.state === "on",
    state: (e) => (e.state === "on" ? "On" : "Off"),
    tap: (call, e) => call("switch", "toggle", {}, target(e)),
  },
  input_boolean: {
    icon: "mdi:toggle-switch-variant",
    tone: "var(--tone-info)",
    on: (e) => e.state === "on",
    state: (e) => (e.state === "on" ? "On" : "Off"),
    tap: (call, e) => call("input_boolean", "toggle", {}, target(e)),
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
    setLevel: (call, e, v) => call("fan", "set_percentage", { percentage: v }, target(e)),
    tap: (call, e) => call("fan", "toggle", {}, target(e)),
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
    setLevel: (call, e, v) => call("cover", "set_cover_position", { position: v }, target(e)),
    tap: (call, e) =>
      call("cover", e.state === "closed" ? "open_cover" : "close_cover", {}, target(e)),
  },
  lock: {
    icon: (e) => (e.state === "locked" ? "mdi:lock" : "mdi:lock-open-variant"),
    tone: "var(--tone-success)",
    on: (e) => e.state === "locked",
    state: (e) => titleCase(e.state),
    tap: (call, e) => call("lock", e.state === "locked" ? "unlock" : "lock", {}, target(e)),
  },
  climate: {
    icon: "mdi:thermostat",
    tone: "var(--tone-danger)",
    on: (e) => e.state !== "off",
    state: (e) => {
      if (e.state === "off") return "Off";
      const t = e.attributes.temperature;
      return typeof t === "number" ? `${titleCase(e.state)} · ${t}°` : titleCase(e.state);
    },
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
    setLevel: (call, e, v) =>
      call("media_player", "volume_set", { volume_level: v / 100 }, target(e)),
    tap: (call, e) => call("media_player", "media_play_pause", {}, target(e)),
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
    tap: (call, e) => call("button", "press", {}, target(e)),
  },
  input_button: {
    icon: "mdi:gesture-tap-button",
    tone: "var(--tone-accent)",
    on: () => false,
    state: (e) => pressedAt(e.state),
    tap: (call, e) => call("input_button", "press", {}, target(e)),
  },
  scene: {
    icon: "mdi:palette",
    tone: "var(--tone-accent)",
    on: () => false,
    state: () => "Tap to run",
    tap: (call, e) => call("scene", "turn_on", {}, target(e)),
  },
  script: {
    icon: "mdi:script-text",
    tone: "var(--tone-accent)",
    on: (e) => e.state === "on",
    state: (e) => (e.state === "on" ? "Running" : "Tap to run"),
    tap: (call, e) => call("script", "turn_on", {}, target(e)),
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
  const { callService } = useService();
  const [dragging, setDragging] = createSignal<number | undefined>();
  createEffect(() => {
    entity();
    setDragging(undefined);
  });
  return (
    <Show when={entity()}>
      {(e) => {
        const d = () => DOMAINS[e().domain] ?? FALLBACK;
        const level = () => dragging() ?? d().level?.(e());
        const setLevel = () => d().setLevel;
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
            on={d().on(e())}
            slide={
              setLevel() && level() !== undefined
                ? {
                    value: level() ?? 0,
                    onChange: setDragging,
                    onCommit: (v) => setLevel()?.(callService, e(), v),
                  }
                : undefined
            }
            onTap={d().tap ? () => d().tap?.(callService, e()) : undefined}
            onHold={props.onHold}
          />
        );
      }}
    </Show>
  );
}
