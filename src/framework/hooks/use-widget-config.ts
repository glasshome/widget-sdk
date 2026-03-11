/**
 * Widget Config Hook
 *
 * Generalized config management that accepts save/delete callbacks.
 * Host-agnostic: the host application provides the actual persistence logic.
 *
 * @example
 * ```tsx
 * const { save, remove, isSaving, isDeleting } = useWidgetConfig({
 *   onSave: async (config) => {
 *     await api.saveWidgetConfig(widgetId, config);
 *   },
 *   onDelete: async () => {
 *     await api.deleteWidget(widgetId);
 *   },
 * });
 *
 * // In a form submit handler:
 * save({ title: "My Widget", entityIds: ["sensor.temp"] });
 * ```
 */

import { createSignal } from "solid-js";

export interface UseWidgetConfigOptions<TConfig = Record<string, unknown>> {
  /** Callback to save widget configuration */
  onSave?: (config: TConfig) => void | Promise<void>;
  /** Callback to delete widget */
  onDelete?: () => void | Promise<void>;
  /** Callback after successful save */
  onSaveSuccess?: () => void;
  /** Callback after successful delete */
  onDeleteSuccess?: () => void;
}

export interface UseWidgetConfigReturn<TConfig = Record<string, unknown>> {
  /** Save widget configuration */
  save: (config: TConfig) => Promise<void>;
  /** Delete widget */
  remove: () => Promise<void>;
  /** Whether save is in progress */
  isSaving: () => boolean;
  /** Whether delete is in progress */
  isDeleting: () => boolean;
}

/**
 * Hook for managing widget configuration save/delete operations
 *
 * @param options - Configuration with save/delete callbacks
 * @returns Save and delete functions with loading states
 */
export function useWidgetConfig<TConfig = Record<string, unknown>>(
  options: UseWidgetConfigOptions<TConfig> = {},
): UseWidgetConfigReturn<TConfig> {
  const [isSaving, setIsSaving] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);

  const save = async (config: TConfig): Promise<void> => {
    if (!options.onSave) return;

    setIsSaving(true);
    try {
      await options.onSave(config);
      options.onSaveSuccess?.();
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (): Promise<void> => {
    if (!options.onDelete) return;

    setIsDeleting(true);
    try {
      await options.onDelete();
      options.onDeleteSuccess?.();
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    save,
    remove,
    isSaving,
    isDeleting,
  };
}
