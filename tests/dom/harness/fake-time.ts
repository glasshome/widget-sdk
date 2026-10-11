import { afterEach, vi } from "vitest";

afterEach(() => {
  if (vi.isFakeTimers()) vi.useRealTimers();
});

export function useFakeTime(config?: {
  toFake?: NonNullable<Parameters<typeof vi.useFakeTimers>[0]>["toFake"];
}): void {
  vi.useFakeTimers(config);
}
