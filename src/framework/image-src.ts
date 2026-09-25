import { imagePreset, imageUrl } from "@glasshome/ui/solid";
import type { ImagePresetSource } from "./config";

/** The URL a `field.image` value shows: the picked preset's picture, or the uploaded image. */
export function imageSrc(
  value: string | null | undefined,
  presets?: Record<string, ImagePresetSource>,
): string | undefined {
  const key = imagePreset(value);
  if (key !== undefined) return presets?.[key]?.src;
  return imageUrl(value);
}
