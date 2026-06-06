/**
 * Widget Dialog Hook
 *
 * Single source of truth for a widget's dialog state: open/closed and the
 * active tab. Registers an imperative opener on the host context so the
 * host can open the dialog on a chosen tab (e.g. dashboard edit mode
 * opening "edit" directly).
 *
 * @example
 * ```tsx
 * function MyWidget() {
 *   const { openDialog, dialogProps } = useWidgetDialog();
 *
 *   return (
 *     <>
 *       <Widget gestures={{ hold: { action: openDialog } }}>
 *         {/* widget content *\/}
 *       </Widget>
 *       <WidgetDialog {...dialogProps} />
 *     </>
 *   );
 * }
 * ```
 */

import { createSignal, onCleanup, useContext } from "solid-js";
import { WidgetCtx } from "./use-widget-context";

export interface WidgetDialogReturn {
  /** Current dialog open state accessor */
  showDialog: () => boolean;
  /** Set dialog state directly */
  setShowDialog: (open: boolean) => void;
  /** Open the dialog, optionally landing on a specific tab */
  openDialog: (tab?: string) => void;
  /** Close the dialog */
  closeDialog: () => void;
  /** Current active tab accessor */
  activeTab: () => string;
  /** Set active tab */
  setActiveTab: (tab: string) => void;
  /** Spread onto `<WidgetDialog>` to wire open + tab state. */
  dialogProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    activeTab: string;
    onActiveTabChange: (tab: string) => void;
  };
}

/**
 * Hook for managing widget dialog state
 *
 * @param defaultTab - Tab the dialog lands on when no explicit tab is
 *   requested (default: "controls")
 * @returns Dialog state and control functions
 */
export function useWidgetDialog(defaultTab = "controls"): WidgetDialogReturn {
  const [showDialog, setShowDialog] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal(defaultTab);

  const openDialog = (tab?: string) => {
    setActiveTab(tab ?? defaultTab);
    setShowDialog(true);
  };

  // Host RPC: let the host (dashboard) open this dialog imperatively.
  const ctx = useContext(WidgetCtx);
  ctx?.registerDialogOpener?.(openDialog);
  onCleanup(() => ctx?.registerDialogOpener?.(null));

  return {
    showDialog,
    setShowDialog,
    openDialog,
    closeDialog: () => setShowDialog(false),
    activeTab,
    setActiveTab,
    dialogProps: {
      get open() {
        return showDialog();
      },
      onOpenChange: setShowDialog,
      get activeTab() {
        return activeTab();
      },
      onActiveTabChange: setActiveTab,
    },
  };
}
