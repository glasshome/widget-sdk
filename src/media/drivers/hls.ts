import type { StreamCallbacks, StreamDriver } from "./types";

const MAX_RECOVERIES = 2;
const NETWORK_RETRY_MS = 2000;

// Native HLS (Safari) exposes audioTracks; lib.dom does not type it.
const audioTrackCount = (el: HTMLVideoElement) =>
  (el as HTMLVideoElement & { audioTracks?: { length: number } }).audioTracks?.length ?? 0;

export function startHls(el: HTMLVideoElement, url: string, cb: StreamCallbacks): StreamDriver {
  let stopped = false;
  let destroy: (() => void) | null = null;
  let retry: ReturnType<typeof setTimeout> | undefined;

  const onPlaying = () => {
    if (audioTrackCount(el) > 0) cb.onAudio(true);
    cb.onLive();
  };
  const onNativeError = () =>
    cb.onError(`native hls error: media error code ${el.error?.code ?? "unknown"}`);
  el.addEventListener("playing", onPlaying);

  void import("hls.js")
    .then(({ default: Hls }) => {
      if (stopped) return;
      if (!Hls.isSupported()) {
        if (el.canPlayType("application/vnd.apple.mpegurl")) {
          el.src = url;
          el.addEventListener("error", onNativeError, { once: true });
        } else {
          cb.onError("hls unsupported");
        }
        return;
      }
      // The CSP's worker-src forbids hls.js's blob: worker; it would fall back to the main thread anyway.
      const hls = new Hls({ enableWorker: false, lowLatencyMode: true });
      destroy = () => hls.destroy();
      let mediaRecoveries = 0;
      let networkRecoveries = 0;
      hls.on(Hls.Events.BUFFER_CODECS, (_event, data) => {
        if (data.audio || data.audiovideo) cb.onAudio(true);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        const code = data.response?.code;
        const detail = code ? `${data.details} (http ${code})` : data.details;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveries++ < MAX_RECOVERIES) {
          hls.recoverMediaError();
        } else if (
          data.type === Hls.ErrorTypes.NETWORK_ERROR &&
          networkRecoveries++ < MAX_RECOVERIES
        ) {
          retry = setTimeout(() => hls.startLoad(), NETWORK_RETRY_MS);
        } else {
          hls.destroy();
          destroy = null;
          cb.onError(`hls ${data.type}: ${detail}`);
        }
      });
      hls.loadSource(url);
      hls.attachMedia(el);
    })
    .catch(() => {
      if (!stopped) cb.onError("hls player failed to load");
    });

  return {
    stop: () => {
      stopped = true;
      clearTimeout(retry);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("error", onNativeError);
      destroy?.();
      destroy = null;
    },
  };
}
