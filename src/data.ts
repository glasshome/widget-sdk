/**
 * Home Assistant data and service hooks, re-exported from
 * @glasshome/sync-layer. Widgets must import these from the SDK instead of
 * sync-layer directly: the single store instance lives in the host (via the
 * import map), and a direct import would bundle a second, disconnected
 * store. Phase 4 routes these through capability checks.
 */
import * as syncLayer from "@glasshome/sync-layer";
import { useLocale as useServerLocale } from "@glasshome/sync-layer/solid";
import { deprecate } from "./deprecations";

export {
  getForecasts,
  hassMediaUrl,
  state,
  trackEntityHistory,
  untrackEntityHistory,
} from "@glasshome/sync-layer";

// Each reads sync-layer at call time, as the plain re-exports did, so loading the SDK touches none of them.
/** @deprecated since 1.31.0, removed in 2.0.0. Use `<CameraStream entityId kind="hls">`. */
export const getStream: typeof syncLayer.getStream = deprecate(
  (...args: Parameters<typeof syncLayer.getStream>) => syncLayer.getStream(...args),
  "getStream",
);
/** @deprecated since 1.31.0, removed in 2.0.0. Use `<CameraStream entityId kind="webrtc">`. */
export const getWebRtcClientConfig: typeof syncLayer.getWebRtcClientConfig = deprecate(
  (...args: Parameters<typeof syncLayer.getWebRtcClientConfig>) =>
    syncLayer.getWebRtcClientConfig(...args),
  "getWebRtcClientConfig",
);
/** @deprecated since 1.31.0, removed in 2.0.0. Use `<CameraStream entityId kind="webrtc">`. */
export const startWebRtcSession: typeof syncLayer.startWebRtcSession = deprecate(
  (...args: Parameters<typeof syncLayer.startWebRtcSession>) =>
    syncLayer.startWebRtcSession(...args),
  "startWebRtcSession",
);
/** @deprecated since 1.31.0, removed in 2.0.0. Use `<CameraStream entityId kind="webrtc">`. */
export const sendWebRtcCandidate: typeof syncLayer.sendWebRtcCandidate = deprecate(
  (...args: Parameters<typeof syncLayer.sendWebRtcCandidate>) =>
    syncLayer.sendWebRtcCandidate(...args),
  "sendWebRtcCandidate",
);
/** @deprecated since 1.34.0, removed in 2.0.0. Use `useTranslation().locale`. */
export const useLocale: typeof useServerLocale = deprecate(() => useServerLocale(), "useLocale");
export type {
  AreaView,
  CalendarEvent,
  CalendarEventsData,
  CalendarWindowOptions,
  ForecastType,
  WeatherForecast,
} from "@glasshome/sync-layer";
export {
  byDomain,
  useArea,
  useCalendarEvents,
  useCamera,
  useConnection,
  useCurrency,
  useEntities,
  useEntity,
  useEntityHistory,
  useEntityStatistics,
  useForecast,
  useHassConfig,
  useStore,
  useTemperatureUnit,
  useUnitSystem,
} from "@glasshome/sync-layer/solid";
// Capability-routed inside a host-mounted widget; direct fallback elsewhere.
export {
  type ServiceShortcut,
  useService,
  useToggle,
  useTurnOff,
  useTurnOn,
} from "./framework/hooks/use-service";
