import { createSignal, onCleanup } from "solid-js";

export type CopyState = "idle" | "copied" | "failed";

/** Dashboards are reached over plain http on the LAN, where navigator.clipboard
 *  does not exist; the selection path is the only copy those installs have. */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // permission or focus denial, fall through to the selection path
    }
  }
  return copyViaSelection(text);
}

function copyViaSelection(text: string): boolean {
  const previous = deepActiveElement();
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  // A focus trap only lets the textarea take focus when it sits inside the
  // trapped subtree, and a copy from an unfocused one reports success having
  // copied nothing.
  (previous?.parentElement ?? document.body).append(area);
  try {
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    const root = area.getRootNode() as Document | ShadowRoot;
    if (root.activeElement !== area) return false;
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
    previous?.focus();
  }
}

function deepActiveElement(): HTMLElement | null {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
  return element instanceof HTMLElement ? element : null;
}

/** Copy plus the state a control needs to say what happened. */
export function useCopyText(resetAfterMs = 2000) {
  const [state, setState] = createSignal<CopyState>("idle");
  let timer: ReturnType<typeof setTimeout> | undefined;

  onCleanup(() => clearTimeout(timer));

  const copy = async (text: string) => {
    setState((await copyText(text)) ? "copied" : "failed");
    clearTimeout(timer);
    timer = setTimeout(() => setState("idle"), resetAfterMs);
  };

  return { state, copy };
}
