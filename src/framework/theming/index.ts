/**
 * Widget Theming - Shared Colors
 *
 * Simple color palette for entity states.
 * Widgets can use these or define their own logic.
 */

export { type AdaptiveIconColors, deriveAdaptiveIconColors } from "./adaptive-color";
export {
  GRADIENT_NAMES,
  GRADIENT_PRESET_KEYS,
  GRADIENT_PRESETS,
  type GradientPreset,
  getGradient,
  getGradientFromString,
  gradientColorPresets,
  stateColors,
  type WidgetColorPreset,
} from "./colors";
