import { afterEach, vi } from "vitest";

afterEach(() => {
  if (vi.isFakeTimers()) vi.useRealTimers();
});

export function useFakeTime(): void {
  vi.useFakeTimers();
}
