import type { WidgetStyles } from "../types";

const builtInVariants: Record<string, WidgetStyles> = {
  "classic-glass": {
    cssVars: {
      "--widget-padding": "1.5rem",
      // ui CARD_BLUR as a cssVar: the host's performant-blur sheet gates this channel.
      "--widget-backdrop":
        "blur(var(--glass-blur, var(--material-blur, 24px))) saturate(calc(1.8 * var(--_material-vibrancy, 1))) brightness(calc(1 + (var(--_material-vibrancy, 1) - 1) * 0.2))",
    },
  },
  minimal: {
    cssVars: {
      "--widget-padding": "1rem",
      "--glass-base": "transparent",
      "--glass-wash": "0%",
      "--glass-light": "0",
      "--glass-rim": "0",
      "--glass-lift": "0",
      "--glass-edge": "transparent",
    },
  },
  "compact-horizontal": {
    cssVars: {
      "--widget-padding": "1rem",
      "--widget-icon-size": "2.5rem",
      "--widget-backdrop": "blur(16px) saturate(1.8)",
    },
  },
};

export function getBuiltInVariantStyles(id: string): WidgetStyles | undefined {
  return Object.hasOwn(builtInVariants, id) ? builtInVariants[id] : undefined;
}
