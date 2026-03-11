/**
 * Z-Index Constants
 *
 * Provides consistent z-index layering for widget elements.
 *
 * @example
 * ```tsx
 * <div style={{ "z-index": WIDGET_Z.BACKGROUND }}>
 *   <CustomBackground />
 * </div>
 * ```
 */

export const WIDGET_Z = {
  /** Background layer (gradients, images, glows) */
  BACKGROUND: 0,
  /** Main content layer (icon, title, text) */
  CONTENT: 10,
  /** Overlay layer (loading states, volume indicators) */
  OVERLAY: 20,
  /** Action layer (buttons, edit controls) */
  ACTIONS: 30,
} as const;

export type WidgetZIndex = (typeof WIDGET_Z)[keyof typeof WIDGET_Z];
