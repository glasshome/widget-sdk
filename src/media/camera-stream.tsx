import { Button, Icon } from "@glasshome/ui/solid";
import { createEffect, createSignal, type JSX, on, onCleanup, onMount, Show } from "solid-js";
import { useCameraSource } from "./camera-source";
import { startHls } from "./drivers/hls";
import { reasonOf, type StreamCallbacks, type StreamDriver } from "./drivers/types";
import { startWebRtc } from "./drivers/webrtc";

export interface CameraStreamProps {
  entityId: string;
  /** `image` shows `src`, an MJPEG stream or a snapshot, in the same box and full screen. */
  kind: "webrtc" | "hls" | "image";
  /** The picture an `image` stream shows; a new value replaces it in place. */
  src?: string;
  /** A new value restarts the stream in place, so full screen stays. */
  session?: number;
  muted: boolean;
  poster?: string;
  /** How the video fills the stream's box; `cover` by default. */
  fit?: "cover" | "contain";
  /** Shows a full screen control, which fills the screen with the stream from the homeowner's press. */
  fullscreen?: boolean;
  /** Shows a sound control in full screen, which reports through `onMutedChange`. */
  sound?: boolean;
  class?: string;
  onLive?: () => void;
  onAudio?: (has: boolean) => void;
  onError?: (reason: string) => void;
  onStale?: (reason: string) => void;
  /** Where a stream that has not played yet stands, each time that changes. */
  onStage?: (stage: string) => void;
  onMutedChange?: (muted: boolean) => void;
}

const FILL: JSX.CSSProperties = { position: "absolute", inset: "0", width: "100%", height: "100%" };

/** A camera's live picture, over WebRTC, HLS or an image, from the camera source the host provides. */
export function CameraStream(props: CameraStreamProps): JSX.Element {
  const source = useCameraSource();
  let stage!: HTMLDivElement;
  let video!: HTMLVideoElement;
  const [full, setFull] = createSignal(false);
  const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;
  const image = () => props.kind === "image";

  onMount(() => {
    createEffect(
      on([() => props.entityId, () => props.kind, () => props.session], ([entityId, kind]) => {
        if (kind === "image") return;
        let current = true;
        let driver: StreamDriver | undefined;
        const cb: StreamCallbacks = {
          onLive: () => current && props.onLive?.(),
          onAudio: (has) => current && props.onAudio?.(has),
          onError: (reason) => current && props.onError?.(reason),
          onStale: (reason) => current && props.onStale?.(reason),
          onStage: (at) => current && props.onStage?.(at),
        };
        if (kind === "webrtc") {
          try {
            driver = startWebRtc(video, source.webrtc(entityId), cb);
          } catch (err) {
            cb.onError(`webrtc: ${reasonOf(err)}`);
          }
        } else {
          cb.onStage("hls stream request");
          Promise.resolve()
            .then(() => source.stream(entityId, "hls"))
            .then((url) => {
              if (!current) return;
              if (!url) return cb.onError("home assistant returned no hls url");
              cb.onStage("hls playlist");
              driver = startHls(video, url, cb);
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
    // document.fullscreenElement names the shadow host when the stage sits in a shadow root.
    const isFull = () => (stage.getRootNode() as Document | ShadowRoot).fullscreenElement === stage;
    const sync = () => setFull(isFull());
    document.addEventListener("fullscreenchange", sync);
    onCleanup(() => {
      document.removeEventListener("fullscreenchange", sync);
      if (isFull()) void document.exitFullscreen();
    });
  });

  const toggle = () => {
    if (full()) void document.exitFullscreen();
    else void stage.requestFullscreen();
  };

  return (
    <div
      ref={stage}
      class={props.class}
      style={{ position: "relative", overflow: "hidden", background: full() ? "black" : undefined }}
    >
      <video
        ref={video}
        autoplay
        playsinline
        muted={props.muted}
        poster={image() ? undefined : props.poster}
        style={{
          ...FILL,
          "object-fit": props.fit ?? "cover",
          display: image() ? "none" : undefined,
        }}
      />
      <Show when={image() && { session: props.session }} keyed>
        {(_session) => {
          let current = true;
          let picture!: HTMLImageElement;
          onCleanup(() => {
            current = false;
            // A detached MJPEG image keeps its stream open until its src goes.
            picture.removeAttribute("src");
          });
          return (
            <img
              ref={picture}
              src={props.src}
              alt=""
              onLoad={() => current && props.onLive?.()}
              onError={() => current && props.onError?.("image error")}
              style={{ ...FILL, "object-fit": full() ? "contain" : (props.fit ?? "cover") }}
            />
          );
        }}
      </Show>
      <Show when={props.fullscreen && canFullscreen}>
        <div
          style={{
            position: "absolute",
            left: "0.75rem",
            bottom: "0.75rem",
            display: "flex",
            gap: "0.5rem",
          }}
        >
          <Button
            variant="outline"
            size="icon"
            aria-label={full() ? "Exit full screen" : "Full screen"}
            onClick={toggle}
          >
            <Icon icon={full() ? "mdi:fullscreen-exit" : "mdi:fullscreen"} width={18} />
          </Button>
          <Show when={full() && props.sound}>
            <Button
              variant={props.muted ? "outline" : "default"}
              size="icon"
              aria-label={props.muted ? "Turn sound on" : "Turn sound off"}
              onClick={() => props.onMutedChange?.(!props.muted)}
            >
              <Icon icon={props.muted ? "mdi:volume-off" : "mdi:volume-high"} width={18} />
            </Button>
          </Show>
        </div>
      </Show>
    </div>
  );
}
