/**
 * Home Assistant data and service hooks, re-exported from
 * @glasshome/sync-layer. Widgets must import these from the SDK instead of
 * sync-layer directly: the single store instance lives in the host (via the
 * import map), and a direct import would bundle a second, disconnected
 * store. Phase 4 routes these through capability checks.
 */
import * as syncLayer from "@glasshome/sync-layer";
import { deprecate } from "./deprecations";

export {
  getForecasts,
  hassMediaUrl,
  state,
  trackEntityHistory,
  untrackEntityHistory,
} from "@glasshome/sync-layer";

/** @deprecated since 1.31.0, removed in 2.0.0. Use `<CameraStream entityId kind="hls">`. */
export const getStream: typeof syncLayer.getStream = deprecate(syncLayer.getStream, "getStream");
/** @deprecated since 1.31.0, removed in 2.0.0. Use `<CameraStream entityId kind="webrtc">`. */
export const getWebRtcClientConfig: typeof syncLayer.getWebRtcClientConfig = deprecate(
  syncLayer.getWebRtcClientConfig,
  "getWebRtcClientConfig",
);
/** @deprecated since 1.31.0, removed in 2.0.0. Use `<CameraStream entityId kind="webrtc">`. */
export const startWebRtcSession: typeof syncLayer.startWebRtcSession = deprecate(
  syncLayer.startWebRtcSession,
  "startWebRtcSession",
);
/** @deprecated since 1.31.0, removed in 2.0.0. Use `<CameraStream entityId kind="webrtc">`. */
export const sendWebRtcCandidate: typeof syncLayer.sendWebRtcCandidate = deprecate(
  syncLayer.sendWebRtcCandidate,
  "sendWebRtcCandidate",
);
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
  useLocale,
  useStore,
  useTemperatureUnit,
  useUnitSystem,
} from "@glasshome/sync-layer/solid";
// Capability-routed inside a host-mounted widget; direct fallback elsewhere.
export { useService, useToggle, useTurnOff, useTurnOn } from "./framework/hooks/use-service";
