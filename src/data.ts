/**
 * Home Assistant data and service hooks, re-exported from
 * @glasshome/sync-layer. Widgets must import these from the SDK instead of
 * sync-layer directly: the single store instance lives in the host (via the
 * import map), and a direct import would bundle a second, disconnected
 * store. Phase 4 routes these through capability checks.
 */
export {
  getForecasts,
  getStream,
  getWebRtcClientConfig,
  sendWebRtcCandidate,
  startWebRtcSession,
  state,
  trackEntityHistory,
  untrackEntityHistory,
} from "@glasshome/sync-layer";
export type { AreaView } from "@glasshome/sync-layer";
export {
  byDomain,
  useArea,
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
  useService,
  useStore,
  useTemperatureUnit,
  useToggle,
  useTurnOn,
  useUnitSystem,
} from "@glasshome/sync-layer/solid";
