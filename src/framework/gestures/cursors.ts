/**
 * Custom SVG cursors for widget gestures.
 * Each cursor is a data URI embedded inline — no external files needed.
 * Hotspot coordinates are included for proper click positioning.
 */

const SIZE = 32;
const HALF = SIZE / 2;
const STROKE = "white";
const STROKE_SHADOW = "rgba(0,0,0,0.4)";
const SW = 2;
const SW_SHADOW = 3;

function svgDataUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function wrapSvg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${inner}</svg>`;
}

// Tap: simple pointer hand with index finger extended
const tapSvg = wrapSvg(`
  <g transform="translate(6, 2)">
    <!-- shadow -->
    <g stroke="${STROKE_SHADOW}" stroke-width="${SW_SHADOW}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 8V3a2 2 0 0 1 4 0v10l4.5-4.5a2 2 0 0 1 2.83 2.83L14 18.5c-2 2-4 3.5-8 3.5-3 0-5-2-5-5v-6a2 2 0 0 1 4 0v2"/>
    </g>
    <!-- main -->
    <g stroke="${STROKE}" stroke-width="${SW}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 8V3a2 2 0 0 1 4 0v10l4.5-4.5a2 2 0 0 1 2.83 2.83L14 18.5c-2 2-4 3.5-8 3.5-3 0-5-2-5-5v-6a2 2 0 0 1 4 0v2"/>
    </g>
  </g>
`);

// Hold: thin ring with center dot
const holdSvg = wrapSvg(`
  <g>
    <circle cx="${HALF}" cy="${HALF}" r="8" stroke="${STROKE_SHADOW}" stroke-width="${SW_SHADOW}" fill="none"/>
    <circle cx="${HALF}" cy="${HALF}" r="8" stroke="${STROKE}" stroke-width="1.5" fill="none"/>
    <circle cx="${HALF}" cy="${HALF}" r="1.5" fill="${STROKE}"/>
  </g>
`);

// Slide horizontal: left-right arrows
const slideHorizontalSvg = wrapSvg(`
  <g>
    <!-- shadow -->
    <g stroke="${STROKE_SHADOW}" stroke-width="${SW_SHADOW}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <line x1="6" y1="${HALF}" x2="26" y2="${HALF}"/>
      <polyline points="10,${HALF - 4} 6,${HALF} 10,${HALF + 4}"/>
      <polyline points="22,${HALF - 4} 26,${HALF} 22,${HALF + 4}"/>
    </g>
    <!-- main -->
    <g stroke="${STROKE}" stroke-width="${SW}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <line x1="6" y1="${HALF}" x2="26" y2="${HALF}"/>
      <polyline points="10,${HALF - 4} 6,${HALF} 10,${HALF + 4}"/>
      <polyline points="22,${HALF - 4} 26,${HALF} 22,${HALF + 4}"/>
    </g>
    <!-- center grip dots -->
    <circle cx="${HALF}" cy="${HALF}" r="1.5" fill="${STROKE}"/>
    <circle cx="${HALF - 5}" cy="${HALF}" r="1" fill="${STROKE}" opacity="0.6"/>
    <circle cx="${HALF + 5}" cy="${HALF}" r="1" fill="${STROKE}" opacity="0.6"/>
  </g>
`);

// Slide vertical: up-down arrows
const slideVerticalSvg = wrapSvg(`
  <g>
    <!-- shadow -->
    <g stroke="${STROKE_SHADOW}" stroke-width="${SW_SHADOW}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <line x1="${HALF}" y1="6" x2="${HALF}" y2="26"/>
      <polyline points="${HALF - 4},10 ${HALF},6 ${HALF + 4},10"/>
      <polyline points="${HALF - 4},22 ${HALF},26 ${HALF + 4},22"/>
    </g>
    <!-- main -->
    <g stroke="${STROKE}" stroke-width="${SW}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <line x1="${HALF}" y1="6" x2="${HALF}" y2="26"/>
      <polyline points="${HALF - 4},10 ${HALF},6 ${HALF + 4},10"/>
      <polyline points="${HALF - 4},22 ${HALF},26 ${HALF + 4},22"/>
    </g>
    <!-- center grip dots -->
    <circle cx="${HALF}" cy="${HALF}" r="1.5" fill="${STROKE}"/>
    <circle cx="${HALF}" cy="${HALF - 5}" r="1" fill="${STROKE}" opacity="0.6"/>
    <circle cx="${HALF}" cy="${HALF + 5}" r="1" fill="${STROKE}" opacity="0.6"/>
  </g>
`);

// Slide auto (both directions): four-way arrows
const slideAutoSvg = wrapSvg(`
  <g>
    <!-- shadow -->
    <g stroke="${STROKE_SHADOW}" stroke-width="${SW_SHADOW}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <line x1="7" y1="${HALF}" x2="25" y2="${HALF}"/>
      <line x1="${HALF}" y1="7" x2="${HALF}" y2="25"/>
      <polyline points="11,${HALF - 3} 7,${HALF} 11,${HALF + 3}"/>
      <polyline points="21,${HALF - 3} 25,${HALF} 21,${HALF + 3}"/>
      <polyline points="${HALF - 3},11 ${HALF},7 ${HALF + 3},11"/>
      <polyline points="${HALF - 3},21 ${HALF},25 ${HALF + 3},21"/>
    </g>
    <!-- main -->
    <g stroke="${STROKE}" stroke-width="${SW}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <line x1="7" y1="${HALF}" x2="25" y2="${HALF}"/>
      <line x1="${HALF}" y1="7" x2="${HALF}" y2="25"/>
      <polyline points="11,${HALF - 3} 7,${HALF} 11,${HALF + 3}"/>
      <polyline points="21,${HALF - 3} 25,${HALF} 21,${HALF + 3}"/>
      <polyline points="${HALF - 3},11 ${HALF},7 ${HALF + 3},11"/>
      <polyline points="${HALF - 3},21 ${HALF},25 ${HALF + 3},21"/>
    </g>
    <!-- center dot -->
    <circle cx="${HALF}" cy="${HALF}" r="2" fill="${STROKE}"/>
  </g>
`);

export interface CursorDef {
  css: string;
  hotspotX: number;
  hotspotY: number;
}

function makeCursor(svg: string, hotspotX: number, hotspotY: number): CursorDef {
  return { css: `${svgDataUri(svg)} ${hotspotX} ${hotspotY}, auto`, hotspotX, hotspotY };
}

export const cursors = {
  tap: makeCursor(tapSvg, 12, 4),
  hold: makeCursor(holdSvg, 16, 16),
  slideHorizontal: makeCursor(slideHorizontalSvg, HALF, HALF),
  slideVertical: makeCursor(slideVerticalSvg, HALF, HALF),
  slideAuto: makeCursor(slideAutoSvg, HALF, HALF),
} as const;
