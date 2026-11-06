import { Button, Icon } from "@glasshome/ui/solid";
import { createEffect, createSignal, type JSX, on, onCleanup, onMount, Show } from "solid-js";
import { useCameraSource } from "./camera-source";
import { startHls } from "./drivers/hls";
import { reasonOf, type StreamCallbacks, type StreamDriver } from "./drivers/types";
import { startWebRtc } from "./drivers/webrtc";

export interface CameraStreamProps {
  entityId: string;
  kind: "webrtc" | "hls";
  muted: boolean;
  poster?: string;
  /** How the video fills the stream's box; `cover` by default. */
  fit?: "cover" | "contain";
  /** Shows a full screen control, which fills the screen with the stream from the homeowner's press. */
  fullscreen?: boolean;
  class?: string;
  onLive?: () => void;
  onAudio?: (has: boolean) => void;
  onError?: (reason: string) => void;
  onStale?: (reason: string) => void;
}

const FILL: JSX.CSSProperties = { position: "absolute", inset: "0", width: "100%", height: "100%" };

/** A camera's live video, over WebRTC or HLS, from the camera source the host provides. */
export function CameraStream(props: CameraStreamProps): JSX.Element {
  const source = useCameraSource();
  let stage!: HTMLDivElement;
  let video!: HTMLVideoElement;
  const [full, setFull] = createSignal(false);
  const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;

  onMount(() => {
    createEffect(
      on([() => props.entityId, () => props.kind], ([entityId, kind]) => {
        let current = true;
        let driver: StreamDriver | undefined;
        const cb: StreamCallbacks = {
          onLive: () => current && props.onLive?.(),
          onAudio: (has) => current && props.onAudio?.(has),
          onError: (reason) => current && props.onError?.(reason),
          onStale: (reason) => current && props.onStale?.(reason),
        };
        if (kind === "webrtc") {
          try {
            driver = startWebRtc(video, source.webrtc(entityId), cb);
          } catch (err) {
            cb.onError(`webrtc: ${reasonOf(err)}`);
          }
        } else {
          Promise.resolve()
            .then(() => source.stream(entityId, "hls"))
            .then((url) => {
              if (!current) return;
              if (url) driver = startHls(video, url, cb);
              else cb.onError("home assistant returned no hls url");
            })
            .catch((err: unknown) => cb.onError(`hls stream request: ${reasonOf(err)}`));
        }
        onCleanup(() => {
          current = false;
          driver?.stop();
          video.removeAttribute("src");
          // Removing src alone keeps a native HLS stream playing.
          video.load();
        });
      }),
    );
    const sync = () => setFull(document.fullscreenElement === stage);
    document.addEventListener("fullscreenchange", sync);
    onCleanup(() => {
      document.removeEventListener("fullscreenchange", sync);
      if (document.fullscreenElement === stage) void document.exitFullscreen();
    });
  });

  const toggle = () => {
    if (full()) void document.exitFullscreen();
    else void stage.requestFullscreen();
  };

  return (
    <div ref={stage} class={props.class} style={{ position: "relative", overflow: "hidden" }}>
      <video
        ref={video}
        autoplay
        playsinline
        muted={props.muted}
        poster={props.poster}
        style={{ ...FILL, "object-fit": props.fit ?? "cover" }}
      />
      <Show when={props.fullscreen && canFullscreen}>
        <div style={{ position: "absolute", left: "0.75rem", bottom: "0.75rem" }}>
          <Button
            variant="outline"
            size="icon"
            aria-label={full() ? "Exit full screen" : "Full screen"}
            onClick={toggle}
          >
            <Icon icon={full() ? "mdi:fullscreen-exit" : "mdi:fullscreen"} width={18} />
          </Button>
        </div>
      </Show>
    </div>
  );
}
