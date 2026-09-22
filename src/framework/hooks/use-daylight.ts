import { useEntity } from "@glasshome/sync-layer/solid";
import { type Accessor, createEffect, createMemo, createSignal, onCleanup } from "solid-js";

export type DaylightPhase = "day" | "dusk" | "night" | "dawn";

export interface Daylight {
  phase: DaylightPhase;
  isNight: boolean;
  /** Sun elevation in degrees; undefined when the phase comes from the clock. */
  elevation?: number;
}

interface SunReading {
  state: string;
  elevation?: number;
  rising?: boolean;
}

const CIVIL_TWILIGHT = -6;
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
    return { phase, isNight: phase === "night", elevation: e };
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
 * local clock. Ambient like locale; the widget never needs a capability for it.
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
        }
      : undefined;
    return daylightFrom(reading, reading ? new Date() : minute());
  });
}
