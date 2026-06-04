/**
 * Energy design tokens for SVG charts.
 *
 * Each entry resolves to colors directly usable in SVG `fill`/`stroke`
 * attributes: `solid`/`stroke` at full opacity, `fill` reduced for area fills.
 */

const base = {
  solar: "oklch(0.74 0.18 60)",
  grid: "oklch(0.62 0.12 245)",
  battery: "oklch(0.70 0.18 145)",
  ev: "oklch(0.70 0.14 190)",
  home: "oklch(0.68 0.06 250)",
  positive: "oklch(0.70 0.14 160)",
  // Fault red-orange; used only for faults, never normal consumption.
  negative: "oklch(0.64 0.22 27)",
} as const;

export type SvgColorKey = keyof typeof base;

interface SvgColorEntry {
  fill: string;
  stroke: string;
  solid: string;
}

function derive(color: string): SvgColorEntry {
  return {
    fill: `color-mix(in oklch, ${color} 20%, transparent)`,
    stroke: color,
    solid: color,
  };
}

export const svgColors = Object.fromEntries(
  (Object.entries(base) as [SvgColorKey, string][]).map(([key, color]) => [key, derive(color)]),
) as Record<SvgColorKey, SvgColorEntry>;
