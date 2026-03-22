/**
 * Adaptive Color Utilities
 *
 * Derives icon background and glow colors from a dynamic CSS color (rgb, hsl, hex).
 * Used by widgets like lights where the color changes at runtime based on entity state.
 */

interface HSL {
  h: number;
  s: number;
  l: number;
}

function parseHSL(color: string): HSL | null {
  const match = color.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)/);
  if (match) {
    return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
  }
  return null;
}

function parseRGB(color: string): HSL | null {
  const match = color.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
  if (!match) return null;
  return rgbToHSL(Number(match[1]), Number(match[2]), Number(match[3]));
}

function parseHex(color: string): HSL | null {
  const match = color.match(/^#([0-9a-f]{3,8})$/i);
  if (!match) return null;
  let hex = match[1]!;
  if (hex.length === 3) hex = hex[0]! + hex[0]! + hex[1]! + hex[1]! + hex[2]! + hex[2]!;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return rgbToHSL(r, g, b);
}

function rgbToHSL(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function parseCSSColor(color: string): HSL | null {
  return parseHSL(color) ?? parseRGB(color) ?? parseHex(color);
}

function hslString(h: number, s: number, l: number, a?: number): string {
  const hh = Math.round(h);
  const ss = Math.round(Math.min(100, Math.max(0, s)));
  const ll = Math.round(Math.min(100, Math.max(0, l)));
  if (a !== undefined && a < 1) {
    return `hsla(${hh}, ${ss}%, ${ll}%, ${a})`;
  }
  return `hsl(${hh}, ${ss}%, ${ll}%)`;
}

/**
 * Adaptive icon colors derived from a dynamic CSS color.
 */
export interface AdaptiveIconColors {
  /** Icon container background — contrasts against the widget fill */
  background: string;
  /** Box-shadow glow color */
  glow: string;
}

/**
 * Derive icon background and glow from a CSS color string.
 *
 * Strategy:
 * - The widget fill is typically the color at ~30% opacity, so the perceived
 *   background sits around 15-25% lightness on a dark dashboard.
 * - For the icon container we want a darker, richer version of the color that
 *   "pops" against that fill. We clamp lightness to a low range and boost
 *   saturation slightly so it reads as a tinted dark square.
 * - For very dark colors (e.g. deep blues) we lift lightness a bit instead.
 * - The glow uses the original color at moderate opacity.
 */
export function deriveAdaptiveIconColors(cssColor: string): AdaptiveIconColors | null {
  const hsl = parseCSSColor(cssColor);
  if (!hsl) return null;

  const { h, s, l } = hsl;

  // Icon background: aim for a dark tinted square that contrasts with the
  // semi-transparent fill behind it.
  // - High lightness colors (warm white, pastels): push down to ~18-22%
  // - Mid lightness colors (saturated): push down to ~15-20%
  // - Already dark colors: lift slightly to ~22-28% so it's visible
  let bgL: number;
  let bgS = Math.min(s + 10, 100);

  if (l < 25) {
    // Very dark — lighten slightly
    bgL = l + 12;
    bgS = Math.min(s + 15, 100);
  } else if (l < 40) {
    // Dark-ish — modest push down
    bgL = Math.max(l - 8, 15);
  } else {
    // Mid to bright — darken substantially
    bgL = Math.max(18, l * 0.3);
  }

  // Low-saturation colors (grays, whites) get a subtle tint boost
  if (s < 15) {
    bgS = 10;
    bgL = Math.max(bgL, 20);
  }

  const background = hslString(h, bgS, bgL, 0.85);
  const glow = hslString(h, Math.min(s, 90), Math.min(l, 55), 0.5);

  return { background, glow };
}
