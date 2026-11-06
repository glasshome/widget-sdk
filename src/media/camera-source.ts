import {
  getStream,
  getWebRtcClientConfig,
  sendWebRtcCandidate,
  startWebRtcSession,
} from "@glasshome/sync-layer";
import { createContext, useContext } from "solid-js";

/** One WebRTC negotiation with Home Assistant for one camera. */
export interface WebRtcSignal {
  /** The ICE servers Home Assistant hands out for this camera; none when it names none. */
  config(): Promise<RTCConfiguration>;
  start(
    offerSdp: string,
    onCandidate: (candidate: RTCIceCandidateInit) => void,
  ): Promise<{ answer: string; sessionId: string | null; stop: () => Promise<void> }>;
  candidate(sessionId: string, candidate: RTCIceCandidateInit): Promise<void>;
}

/** Where a CameraStream gets its video: an HLS playlist URL or a WebRTC negotiation. */
export interface CameraSource {
  stream(entityId: string, kind: "hls"): Promise<string | null>;
  webrtc(entityId: string): WebRtcSignal;
}

const homeAssistant: CameraSource = {
  stream: async (entityId) => {
    const { stream } = await getStream(entityId, { format: "hls", autoRefresh: true });
    if (stream.error) throw stream.error;
    return stream.url;
  },
  webrtc: (entityId) => ({
    config: async () => {
      try {
        return (await getWebRtcClientConfig(entityId)).configuration as RTCConfiguration;
      } catch {
        return {};
      }
    },
    start: async (offerSdp, onCandidate) => {
      const { answer, session } = await startWebRtcSession(entityId, offerSdp, (candidate) =>
        onCandidate(candidate as RTCIceCandidateInit),
      );
      return {
        answer,
        sessionId: session.sessionId,
        stop: () => session.unsubscribe?.() ?? Promise.resolve(),
      };
    },
    candidate: (sessionId, candidate) =>
      sendWebRtcCandidate(entityId, sessionId, candidate as Record<string, unknown>),
  }),
};

let defaultSource: CameraSource = homeAssistant;

/** A tree's own camera source, over the host's default. */
export const CameraSourceContext = createContext<CameraSource>();

/** Host apps call this once at startup; CameraSourceContext overrides it per tree. */
export function provideCameraSource(source: CameraSource): void {
  defaultSource = source;
}

export function useCameraSource(): CameraSource {
  return useContext(CameraSourceContext) ?? defaultSource;
}
