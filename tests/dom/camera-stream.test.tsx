import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import {
  type CameraSource,
  CameraSourceContext,
  type WebRtcSignal,
} from "../../src/media/camera-source";
import { CameraStream } from "../../src/media/camera-stream";

const PICTURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const SIZED = "block h-40 w-60";

const refusing: CameraSource = {
  stream: () => Promise.reject(new Error("not allowed")),
  webrtc: () => {
    throw new Error("not allowed");
  },
};

function mount(kind: "webrtc" | "hls", source?: CameraSource, fullscreen?: boolean) {
  const errors: string[] = [];
  const stream = () => (
    <CameraStream
      entityId="camera.front_door"
      kind={kind}
      muted
      fullscreen={fullscreen}
      onError={(reason) => errors.push(reason)}
    />
  );
  const view = render(() =>
    source ? (
      <CameraSourceContext.Provider value={source}>{stream()}</CameraSourceContext.Provider>
    ) : (
      stream()
    ),
  );
  return { view, errors };
}

describe("CameraStream", () => {
  it.each(["webrtc", "hls"] as const)(
    "%s reports a source that refuses the camera, and keeps rendering",
    async (kind) => {
      const { view, errors } = mount(kind, refusing);
      await expect.poll(() => errors).toEqual([expect.stringContaining("not allowed")]);
      expect(view.container.querySelector("video")).not.toBeNull();
    },
  );

  it.each([
    ["webrtc", /connect/i],
    ["hls", /no hls url/],
  ] as const)("%s reports a home with no connection, and keeps rendering", async (kind, reason) => {
    const { view, errors } = mount(kind);
    await expect.poll(() => errors).toEqual([expect.stringMatching(reason)]);
    expect(view.container.querySelector("video")).not.toBeNull();
  });

  it("a camera switched mid-request reports only the camera it now shows", async () => {
    let answerFirst: (url: string | null) => void = () => {};
    let asked = false;
    const source: CameraSource = {
      stream: (entityId) =>
        entityId === "camera.a"
          ? new Promise((resolve) => {
              asked = true;
              answerFirst = resolve;
            })
          : Promise.reject(new Error("not allowed")),
      webrtc: (entityId) => refusing.webrtc(entityId),
    };
    const errors: string[] = [];
    const [entityId, setEntityId] = createSignal("camera.a");
    render(() => (
      <CameraSourceContext.Provider value={source}>
        <CameraStream
          entityId={entityId()}
          kind="hls"
          muted
          onError={(reason) => errors.push(reason)}
        />
      </CameraSourceContext.Provider>
    ));
    await expect.poll(() => asked).toBe(true);
    setEntityId("camera.b");
    await expect.poll(() => errors).toEqual(["hls stream request: not allowed"]);
    answerFirst(null);
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();
    expect(errors).toEqual(["hls stream request: not allowed"]);
  });

  it("a WebRTC answer that lands after unmount ends its session", async () => {
    let answer: (session: {
      answer: string;
      sessionId: string;
      stop: () => Promise<void>;
    }) => void = () => {};
    let started = false;
    let ended = false;
    const signal: WebRtcSignal = {
      config: () => Promise.resolve({}),
      start: () => {
        started = true;
        return new Promise((resolve) => {
          answer = resolve;
        });
      },
      candidate: () => Promise.resolve(),
    };
    const source: CameraSource = {
      stream: (entityId, kind) => refusing.stream(entityId, kind),
      webrtc: () => signal,
    };
    const view = render(() => (
      <CameraSourceContext.Provider value={source}>
        <CameraStream entityId="camera.front_door" kind="webrtc" muted />
      </CameraSourceContext.Provider>
    ));
    await expect.poll(() => started).toBe(true);
    view.unmount();
    answer({
      answer: "",
      sessionId: "s",
      stop: () => {
        ended = true;
        return Promise.resolve();
      },
    });
    await expect.poll(() => ended).toBe(true);
  });

  it("an image camera shows its picture in the box and fills the screen with it", async () => {
    const live: string[] = [];
    const view = render(() => (
      <CameraStream
        entityId="camera.front_door"
        kind="image"
        src={PICTURE}
        muted
        fullscreen
        class={SIZED}
        onLive={() => live.push("live")}
      />
    ));
    await expect.poll(() => live.length).toBeGreaterThan(0);
    expect(view.container.querySelector("img")?.getAttribute("src")).toBe(PICTURE);
    await userEvent.click(view.getByRole("button", { name: "Full screen" }));
    await expect.poll(() => document.fullscreenElement?.querySelector("img")).toBeTruthy();
    await document.exitFullscreen();
  });

  it("a new session restarts the stream in place, and full screen stays", async () => {
    const asked: string[] = [];
    const source: CameraSource = {
      stream: (entityId) => {
        asked.push(entityId);
        return new Promise(() => {});
      },
      webrtc: (entityId) => refusing.webrtc(entityId),
    };
    const [session, setSession] = createSignal(1);
    const view = render(() => (
      <CameraSourceContext.Provider value={source}>
        <CameraStream
          entityId="camera.front_door"
          kind="hls"
          session={session()}
          muted
          fullscreen
          class={SIZED}
        />
      </CameraSourceContext.Provider>
    ));
    await expect.poll(() => asked).toHaveLength(1);
    await userEvent.click(view.getByRole("button", { name: "Full screen" }));
    await expect.poll(() => document.fullscreenElement).not.toBeNull();
    const stage = document.fullscreenElement;
    setSession(2);
    await expect.poll(() => asked).toHaveLength(2);
    expect(document.fullscreenElement).toBe(stage);
    await document.exitFullscreen();
  });

  it("in full screen, a stream with sound offers its sound control and reports the press", async () => {
    const changes: boolean[] = [];
    const view = render(() => (
      <CameraStream
        entityId="camera.front_door"
        kind="image"
        src={PICTURE}
        muted
        fullscreen
        class={SIZED}
        sound
        onMutedChange={(muted) => changes.push(muted)}
      />
    ));
    expect(view.queryByRole("button", { name: "Turn sound on" })).toBeNull();
    await userEvent.click(view.getByRole("button", { name: "Full screen" }));
    const sound = () => view.queryByRole("button", { name: "Turn sound on" });
    await expect.poll(sound).not.toBeNull();
    await userEvent.click(sound() as HTMLElement);
    expect(changes).toEqual([false]);
    await document.exitFullscreen();
  });

  it("a new session reloads an image camera's picture", async () => {
    const [session, setSession] = createSignal(1);
    const view = render(() => (
      <CameraStream
        entityId="camera.front_door"
        kind="image"
        src={PICTURE}
        session={session()}
        muted
        class={SIZED}
      />
    ));
    const first = view.container.querySelector("img");
    expect(first?.getAttribute("src")).toBe(PICTURE);
    setSession(2);
    const second = view.container.querySelector("img");
    expect(second).not.toBe(first);
    expect(second?.getAttribute("src")).toBe(PICTURE);
    expect(first?.hasAttribute("src")).toBe(false);
  });

  it("an image camera that gives way to a video stream reports nothing more for its picture", async () => {
    const broken = "data:image/png;base64,broken";
    const reports: string[] = [];
    const beside: string[] = [];
    const [kind, setKind] = createSignal<"image" | "hls">("image");
    render(() => (
      <CameraSourceContext.Provider value={refusing}>
        <CameraStream
          entityId="camera.front_door"
          kind={kind()}
          src={broken}
          muted
          onLive={() => reports.push("live")}
          onError={(reason) => reports.push(reason)}
        />
        <CameraStream
          entityId="camera.front_door"
          kind="image"
          src={broken}
          muted
          onError={(reason) => beside.push(reason)}
        />
      </CameraSourceContext.Provider>
    ));
    setKind("hls");
    await expect.poll(() => beside).toEqual(["image error"]);
    await expect.poll(() => reports).toEqual(["hls stream request: not allowed"]);
  });

  it("reports where a WebRTC stream that has not played stands", async () => {
    const stages: string[] = [];
    const signal: WebRtcSignal = {
      config: () => Promise.resolve({}),
      start: () => new Promise(() => {}),
      candidate: () => Promise.resolve(),
    };
    render(() => (
      <CameraSourceContext.Provider value={{ ...refusing, webrtc: () => signal }}>
        <CameraStream
          entityId="camera.front_door"
          kind="webrtc"
          muted
          onStage={(stage) => stages.push(stage)}
        />
      </CameraSourceContext.Provider>
    ));
    await expect.poll(() => stages.at(-1)).toMatch(/^stage home assistant answer, connection \w+$/);
  });

  it("shows the full screen control only when asked", () => {
    const asked = mount("hls", refusing, true).view;
    expect(asked.queryByRole("button", { name: "Full screen" })).not.toBeNull();
    const plain = mount("hls", refusing).view;
    expect(plain.queryByRole("button", { name: "Full screen" })).toBeNull();
  });
});
