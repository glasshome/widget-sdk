import { useEntity } from "@glasshome/sync-layer/solid";
import { type Accessor, createEffect, createMemo, createSignal, onCleanup } from "solid-js";

export type DaylightPhase = "day" | "dusk" | "night" | "dawn";

export interface Daylight {
  phase: DaylightPhase;
  isNight: boolean;
  /** Sun elevation in degrees; undefined when the phase comes from the clock. */
  elevation?: number;
  /** 0..1 through the current day (sunrise to sunset) while the sun is up, else through the night; undefined without `sun.sun`'s rising and setting times. */
  progress?: number;
}

interface SunReading {
  state: string;
  elevation?: number;
  rising?: boolean;
  next_rising?: string;
  next_setting?: string;
}

const CIVIL_TWILIGHT = -6;
const DAY_MS = 86_400_000;

// HA only publishes the next events, so the last one is taken a day earlier.
function progressFrom(sun: SunReading, now: Date): number | undefined {
  const rise = sun.next_rising ? Date.parse(sun.next_rising) : Number.NaN;
  const set = sun.next_setting ? Date.parse(sun.next_setting) : Number.NaN;
  if (!Number.isFinite(rise) || !Number.isFinite(set)) return undefined;
  const [from, to] = sun.state === "above_horizon" ? [rise - DAY_MS, set] : [set - DAY_MS, rise];
  const span = to - from;
  if (span <= 0) return undefined;
  return Math.min(1, Math.max(0, (now.getTime() - from) / span));
}
const NIGHT_FROM_HOUR = 20;
const DAY_FROM_HOUR = 7;

export function daylightFrom(sun: SunReading | undefined, now: Date): Daylight {
  if (sun && (sun.state === "above_horizon" || sun.state === "below_horizon")) {
    const e = sun.elevation;
    const phase: DaylightPhase =
      sun.state === "above_horizon"
        ? "day"
        : e !== undefined && e > CIVIL_TWILIGHT
          ? sun.rising
            ? "dawn"
            : "dusk"
          : "night";
    return { phase, isNight: phase === "night", elevation: e, progress: progressFrom(sun, now) };
  }
  const hour = now.getHours();
  const phase: DaylightPhase = hour >= NIGHT_FROM_HOUR || hour < DAY_FROM_HOUR ? "night" : "day";
  return { phase, isNight: phase === "night" };
}

const [minute, setMinute] = createSignal(new Date());
let holders = 0;
let timer: ReturnType<typeof setInterval> | undefined;

function holdClock(): () => void {
  holders++;
  if (!timer) {
    setMinute(new Date());
    timer = setInterval(() => setMinute(new Date()), 60_000);
  }
  return () => {
    holders--;
    if (holders === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/**
 * Household daylight: from Home Assistant's `sun.sun` when present, else the
 * local clock when the home has no sun entity. Reads `sun.sun`, so the widget
 * declares `{ domain: "sun", access: "read" }`; the build refuses it otherwise.
 */
export function useDaylight(): Accessor<Daylight> {
  const sun = useEntity("sun.sun");
  createEffect(() => {
    if (sun()) return;
    onCleanup(holdClock());
  });
  return createMemo(() => {
    const s = sun();
    const reading: SunReading | undefined = s
      ? {
          state: s.state,
          elevation: s.attributes?.elevation as number | undefined,
          rising: s.attributes?.rising as boolean | undefined,
          next_rising: s.attributes?.next_rising as string | undefined,
          next_setting: s.attributes?.next_setting as string | undefined,
        }
      : undefined;
    return daylightFrom(reading, reading ? new Date() : minute());
  });
}
