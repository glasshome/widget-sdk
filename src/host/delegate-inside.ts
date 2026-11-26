import {
  DelegatedEvents,
  delegateEvents,
  registerDelegatedContainer,
  unregisterDelegatedContainer,
} from "@solidjs/web";

/**
 * Solid handlers inside a closed root run; anything a host renders into one it owns needs this.
 * Event types in `passive` are listened to passively, so they never hold up scrolling.
 */
export function delegateInside(
  shadow: ShadowRoot,
  passive: ReadonlySet<string> = new Set(),
): () => void {
  if (shadow.mode !== "closed") return () => {};
  delegateEvents([...DelegatedEvents]);
  const options = (type: string, capture: boolean | AddEventListenerOptions | undefined) => ({
    capture: typeof capture === "boolean" ? capture : (capture?.capture ?? false),
    passive: passive.has(type),
  });
  // Solid listens on whatever container it is handed; this hands it the root, passive where asked.
  const container = {
    addEventListener: (type: string, listener: EventListener, capture?: boolean) =>
      shadow.addEventListener(type, listener, options(type, capture)),
    removeEventListener: (type: string, listener: EventListener, capture?: boolean) =>
      shadow.removeEventListener(type, listener, options(type, capture)),
    contains: (node: Node | null) => shadow.contains(node),
  } as unknown as ShadowRoot;
  // Owned by the host, so the walk ends on it and the page's own root resumes from there.
  registerDelegatedContainer(container, shadow.host);
  return () => unregisterDelegatedContainer(container, shadow.host);
}
