/**
 * Widget Dialog Hook
 *
 * Provides signal-based dialog state management with optional tab tracking.
 *
 * @example
 * ```tsx
 * function MyWidget() {
 *   const { showDialog, openDialog, closeDialog } = useWidgetDialog();
 *
 *   return (
 *     <>
 *       <Widget gestures={{ hold: { action: openDialog } }}>
 *         {/* widget content *\/}
 *       </Widget>
 *       <WidgetDialog
 *         open={showDialog()}
 *         onOpenChange={setShowDialog}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

import { createSignal } from "solid-js";

export interface WidgetDialogReturn {
  /** Current dialog open state accessor */
  showDialog: () => boolean;
  /** Set dialog state directly */
  setShowDialog: (open: boolean) => void;
  /** Open the dialog */
  openDialog: () => void;
  /** Close the dialog */
  closeDialog: () => void;
  /** Current active tab accessor */
  activeTab: () => string;
  /** Set active tab */
  setActiveTab: (tab: string) => void;
}

/**
 * Hook for managing widget dialog state
 *
 * @param defaultTab - Default active tab (default: "edit")
 * @returns Dialog state and control functions
 */
export function useWidgetDialog(defaultTab = "edit"): WidgetDialogReturn {
  const [showDialog, setShowDialog] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal(defaultTab);

  return {
    showDialog,
    setShowDialog,
    openDialog: () => setShowDialog(true),
    closeDialog: () => setShowDialog(false),
    activeTab,
    setActiveTab,
  };
}
