/**
 * Gradient preset type
 */
export type GradientPreset =
  | "ocean"
  | "sunset"
  | "forest"
  | "lavender"
  | "golden"
  | "midnight"
  | "rose"
  | "mint"
  | "slate"
  | "coral"
  | "aurora"
  | "ember"
  | "steel"
  | "twilight"
  | "sage"
  | "copper"
  | "dusk";

/**
 * 17 gradient presets as Tailwind class strings
 * Using 20% opacity for subtle background that doesn't overpower content
 */
export const GRADIENT_PRESETS: Record<GradientPreset, string> = {
  ocean: "bg-gradient-to-br from-cyan-600/20 to-blue-700/20",
  sunset: "bg-gradient-to-br from-orange-500/20 to-purple-700/20",
  forest: "bg-gradient-to-br from-emerald-600/20 to-teal-700/20",
  lavender: "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
  golden: "bg-gradient-to-br from-yellow-500/20 to-orange-600/20",
  midnight: "bg-gradient-to-br from-blue-700/20 to-indigo-900/20",
  rose: "bg-gradient-to-br from-pink-400/20 to-red-500/20",
  mint: "bg-gradient-to-br from-green-400/20 to-cyan-500/20",
  slate: "bg-gradient-to-br from-slate-600/20 to-slate-800/20",
  coral: "bg-gradient-to-br from-pink-300/20 to-rose-400/20",
  aurora: "bg-gradient-to-br from-blue-500/20 to-cyan-400/20",
  ember: "bg-gradient-to-br from-red-500/20 to-yellow-500/20",
  steel: "bg-gradient-to-br from-gray-500/20 to-gray-700/20",
  twilight: "bg-gradient-to-br from-violet-600/20 to-indigo-700/20",
  sage: "bg-gradient-to-br from-lime-600/20 to-green-600/20",
  copper: "bg-gradient-to-br from-amber-600/20 to-amber-800/20",
  dusk: "bg-gradient-to-br from-blue-500/20 to-purple-600/20",
};

/** Human-readable gradient names for UI display */
export const GRADIENT_NAMES: Record<GradientPreset, string> = {
  ocean: "Ocean Breeze",
  sunset: "Sunset Glow",
  forest: "Forest Dawn",
  lavender: "Lavender Dreams",
  golden: "Golden Hour",
  midnight: "Deep Ocean",
  rose: "Rose Garden",
  mint: "Mint Fresh",
  slate: "Midnight",
  coral: "Cherry Blossom",
  aurora: "Electric Blue",
  ember: "Autumn Leaves",
  steel: "Steel",
  twilight: "Twilight",
  sage: "Sage",
  copper: "Copper",
  dusk: "Dusk",
};

/** Array of all gradient preset keys */
export const GRADIENT_PRESET_KEYS = Object.keys(GRADIENT_PRESETS) as GradientPreset[];

/**
 * Get a consistent gradient preset for any string input
 * Uses a simple hash to deterministically select a gradient
 */
export function getGradientFromString(input: string): GradientPreset {
  const presets = Object.keys(GRADIENT_PRESETS) as GradientPreset[];
  let hash = 0;
  for (const char of input) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % presets.length;
  return presets[index]!;
}

/**
 * Get gradient string
 * @param gradient - Preset name or gradient string
 * @param fallbackString - String to hash for default gradient selection
 */
export function getGradient(
  gradient: GradientPreset | string | undefined,
  fallbackString: string,
): string {
  if (!gradient) {
    const preset = getGradientFromString(fallbackString);
    return GRADIENT_PRESETS[preset];
  }

  if (typeof gradient === "string" && gradient in GRADIENT_PRESETS) {
    return GRADIENT_PRESETS[gradient as GradientPreset];
  }

  if (typeof gradient === "string") {
    return gradient;
  }

  const preset = getGradientFromString(fallbackString);
  return GRADIENT_PRESETS[preset];
}

/**
 * Widget color preset with gradient, icon, glow, and text colors
 */
export interface WidgetColorPreset {
  /** Gradient string (Tailwind classes) */
  gradient: string;
  /** Simple background color for pills/badges (Tailwind class) */
  bg: string;
  /** Icon background with dark: classes */
  icon: string;
  /** Glow/shadow with dark: classes */
  glow: string | undefined;
  /** Text colors */
  text: {
    primary: string;
    muted: string;
  };
}

/**
 * Map gradient presets to full color presets
 * Each preset includes gradient, icon, glow, and text colors
 */
export const gradientColorPresets: Record<GradientPreset, WidgetColorPreset> = {
  ocean: {
    gradient: GRADIENT_PRESETS.ocean,
    bg: "bg-cyan-600/20",
    icon: "bg-cyan-500 dark:bg-cyan-400",
    glow: "shadow-cyan-500/50 dark:shadow-cyan-400/50",
    text: {
      primary: "text-cyan-400 dark:text-cyan-300",
      muted: "text-cyan-400/60 dark:text-cyan-300/60",
    },
  },
  sunset: {
    gradient: GRADIENT_PRESETS.sunset,
    bg: "bg-orange-500/20",
    icon: "bg-orange-500 dark:bg-orange-400",
    glow: "shadow-orange-500/50 dark:shadow-orange-400/50",
    text: {
      primary: "text-orange-400 dark:text-orange-300",
      muted: "text-orange-400/60 dark:text-orange-300/60",
    },
  },
  forest: {
    gradient: GRADIENT_PRESETS.forest,
    bg: "bg-emerald-600/20",
    icon: "bg-emerald-500 dark:bg-emerald-400",
    glow: "shadow-emerald-500/50 dark:shadow-emerald-400/50",
    text: {
      primary: "text-emerald-400 dark:text-emerald-300",
      muted: "text-emerald-400/60 dark:text-emerald-300/60",
    },
  },
  lavender: {
    gradient: GRADIENT_PRESETS.lavender,
    bg: "bg-purple-500/20",
    icon: "bg-purple-500 dark:bg-purple-400",
    glow: "shadow-purple-500/50 dark:shadow-purple-400/50",
    text: {
      primary: "text-purple-400 dark:text-purple-300",
      muted: "text-purple-400/60 dark:text-purple-300/60",
    },
  },
  golden: {
    gradient: GRADIENT_PRESETS.golden,
    bg: "bg-yellow-500/20",
    icon: "bg-yellow-500 dark:bg-yellow-400",
    glow: "shadow-yellow-500/50 dark:shadow-yellow-400/50",
    text: {
      primary: "text-yellow-400 dark:text-yellow-300",
      muted: "text-yellow-400/60 dark:text-yellow-300/60",
    },
  },
  midnight: {
    gradient: GRADIENT_PRESETS.midnight,
    bg: "bg-blue-700/20",
    icon: "bg-blue-700 dark:bg-blue-600",
    glow: "shadow-blue-700/50 dark:shadow-blue-600/50",
    text: {
      primary: "text-blue-400 dark:text-blue-300",
      muted: "text-blue-400/60 dark:text-blue-300/60",
    },
  },
  rose: {
    gradient: GRADIENT_PRESETS.rose,
    bg: "bg-pink-400/20",
    icon: "bg-pink-500 dark:bg-pink-400",
    glow: "shadow-pink-500/50 dark:shadow-pink-400/50",
    text: {
      primary: "text-pink-400 dark:text-pink-300",
      muted: "text-pink-400/60 dark:text-pink-300/60",
    },
  },
  mint: {
    gradient: GRADIENT_PRESETS.mint,
    bg: "bg-green-400/20",
    icon: "bg-green-500 dark:bg-green-400",
    glow: "shadow-green-500/50 dark:shadow-green-400/50",
    text: {
      primary: "text-green-400 dark:text-green-300",
      muted: "text-green-400/60 dark:text-green-300/60",
    },
  },
  slate: {
    gradient: GRADIENT_PRESETS.slate,
    bg: "bg-slate-600/20",
    icon: "bg-slate-600 dark:bg-slate-500",
    glow: "shadow-slate-600/50 dark:shadow-slate-500/50",
    text: {
      primary: "text-slate-400 dark:text-slate-300",
      muted: "text-slate-400/60 dark:text-slate-300/60",
    },
  },
  coral: {
    gradient: GRADIENT_PRESETS.coral,
    bg: "bg-pink-300/20",
    icon: "bg-pink-400 dark:bg-pink-300",
    glow: "shadow-pink-400/50 dark:shadow-pink-300/50",
    text: {
      primary: "text-pink-400 dark:text-pink-300",
      muted: "text-pink-400/60 dark:text-pink-300/60",
    },
  },
  aurora: {
    gradient: GRADIENT_PRESETS.aurora,
    bg: "bg-blue-500/20",
    icon: "bg-blue-500 dark:bg-blue-400",
    glow: "shadow-blue-500/50 dark:shadow-blue-400/50",
    text: {
      primary: "text-blue-400 dark:text-blue-300",
      muted: "text-blue-400/60 dark:text-blue-300/60",
    },
  },
  ember: {
    gradient: GRADIENT_PRESETS.ember,
    bg: "bg-red-500/20",
    icon: "bg-red-500 dark:bg-red-400",
    glow: "shadow-red-500/50 dark:shadow-red-400/50",
    text: {
      primary: "text-red-400 dark:text-red-300",
      muted: "text-red-400/60 dark:text-red-300/60",
    },
  },
  steel: {
    gradient: GRADIENT_PRESETS.steel,
    bg: "bg-gray-500/20",
    icon: "bg-gray-500 dark:bg-gray-400",
    glow: undefined,
    text: {
      primary: "text-gray-400 dark:text-gray-300",
      muted: "text-gray-400/60 dark:text-gray-300/60",
    },
  },
  twilight: {
    gradient: GRADIENT_PRESETS.twilight,
    bg: "bg-violet-600/20",
    icon: "bg-violet-500 dark:bg-violet-400",
    glow: "shadow-violet-500/50 dark:shadow-violet-400/50",
    text: {
      primary: "text-violet-400 dark:text-violet-300",
      muted: "text-violet-400/60 dark:text-violet-300/60",
    },
  },
  sage: {
    gradient: GRADIENT_PRESETS.sage,
    bg: "bg-lime-600/20",
    icon: "bg-lime-500 dark:bg-lime-400",
    glow: "shadow-lime-500/50 dark:shadow-lime-400/50",
    text: {
      primary: "text-lime-400 dark:text-lime-300",
      muted: "text-lime-400/60 dark:text-lime-300/60",
    },
  },
  copper: {
    gradient: GRADIENT_PRESETS.copper,
    bg: "bg-amber-600/20",
    icon: "bg-amber-600 dark:bg-amber-500",
    glow: "shadow-amber-600/50 dark:shadow-amber-500/50",
    text: {
      primary: "text-amber-400 dark:text-amber-300",
      muted: "text-amber-400/60 dark:text-amber-300/60",
    },
  },
  dusk: {
    gradient: GRADIENT_PRESETS.dusk,
    bg: "bg-blue-500/20",
    icon: "bg-blue-500 dark:bg-blue-400",
    glow: "shadow-blue-500/50 dark:shadow-blue-400/50",
    text: {
      primary: "text-blue-400 dark:text-blue-300",
      muted: "text-blue-400/60 dark:text-blue-300/60",
    },
  },
};

/**
 * Shared color palette for entity states
 * Uses gradient presets for consistency
 */
export const stateColors = {
  unavailable: gradientColorPresets.steel,
  active: gradientColorPresets.ocean,
  inactive: gradientColorPresets.steel,
  success: gradientColorPresets.forest,
  warning: gradientColorPresets.ember,
  error: gradientColorPresets.rose,
} as const;
