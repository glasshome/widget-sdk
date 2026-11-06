import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import {
  type CameraSource,
  CameraSourceContext,
  type WebRtcSignal,
} from "../../src/media/camera-source";
import { CameraStream } from "../../src/media/camera-stream";

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

  it("shows the full screen control only when asked", () => {
    const asked = mount("hls", refusing, true).view;
    expect(asked.queryByRole("button", { name: "Full screen" })).not.toBeNull();
    const plain = mount("hls", refusing).view;
    expect(plain.queryByRole("button", { name: "Full screen" })).toBeNull();
  });
});
