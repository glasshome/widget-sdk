import type { WebRtcSignal } from "../camera-source";
import { reasonOf, type StreamCallbacks, type StreamDriver } from "./types";

export function startWebRtc(
  el: HTMLVideoElement,
  signal: WebRtcSignal,
  cb: StreamCallbacks,
): StreamDriver {
  let pc: RTCPeerConnection | null = null;
  let stopSession: (() => Promise<void>) | null = null;
  let stopped = false;
  let playing = false;
  let stage = "config";
  const report = () => {
    if (!stopped) cb.onStage(`stage ${stage}, connection ${pc?.connectionState ?? "none"}`);
  };
  const enter = (next: string) => {
    stage = next;
    report();
  };
  report();

  const onPlaying = () => {
    playing = true;
    cb.onLive();
  };
  el.addEventListener("playing", onPlaying);

  void (async () => {
    try {
      const rtcConfig = await signal.config();
      if (stopped) return;
      const peer = new RTCPeerConnection(rtcConfig);
      pc = peer;
      peer.ontrack = (event) => {
        if (event.track.kind === "audio") cb.onAudio(true);
        if (event.streams[0] && !stopped) el.srcObject = event.streams[0];
      };
      // Home Assistant answers one offer per session, so a failed connection cannot restart ICE.
      peer.onconnectionstatechange = () => {
        if (!playing) report();
        if (peer.connectionState !== "failed") return;
        if (playing) cb.onStale("ice connection failed");
        else cb.onError("ice connection failed");
      };
      peer.addTransceiver("audio", { direction: "recvonly" });
      peer.addTransceiver("video", { direction: "recvonly" });

      enter("local offer");
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      if (stopped) return;

      let sessionId: string | null = null;
      const pending: RTCIceCandidateInit[] = [];
      const send = (candidate: RTCIceCandidateInit) => {
        if (sessionId) signal.candidate(sessionId, candidate).catch(() => {});
        else pending.push(candidate);
      };
      peer.onicecandidate = (event) => {
        if (event.candidate) send(event.candidate.toJSON());
      };

      if (!offer.sdp) throw new Error("offer has no sdp");
      enter("home assistant answer");
      const session = await signal.start(offer.sdp, (candidate) => {
        const init = { ...candidate };
        if (!init.sdpMid && init.sdpMLineIndex == null) init.sdpMid = "0";
        peer.addIceCandidate(new RTCIceCandidate(init)).catch(() => {});
      });
      stopSession = session.stop;
      if (stopped) {
        session.stop().catch(() => {});
        return;
      }
      sessionId = session.sessionId;
      for (const candidate of pending.splice(0)) send(candidate);

      enter("remote description");
      await peer.setRemoteDescription({ type: "answer", sdp: session.answer });
    } catch (err) {
      if (!stopped) cb.onError(`${stage}: ${reasonOf(err)}`);
    }
  })();

  return {
    stop: () => {
      stopped = true;
      el.removeEventListener("playing", onPlaying);
      el.srcObject = null;
      stopSession?.().catch(() => {});
      stopSession = null;
      pc?.close();
      pc = null;
    },
  };
}
