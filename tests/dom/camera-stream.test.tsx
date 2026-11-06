import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { type CameraSource, CameraSourceContext } from "../../src/media/camera-source";
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

  it("shows the full screen control only when asked", () => {
    const asked = mount("hls", refusing, true).view;
    expect(asked.queryByRole("button", { name: "Full screen" })).not.toBeNull();
    const plain = mount("hls", refusing).view;
    expect(plain.queryByRole("button", { name: "Full screen" })).toBeNull();
  });
});
