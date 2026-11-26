import { clearDelegatedEvents, DelegatedEvents, delegateEvents } from "@solidjs/web";

// Handlers passed through props (every ui control) are delegated, and the document cannot see into a closed root.
// Solid's handler leaves target/currentTarget pinned to inner nodes; unpin, registered after it, removes them before the event leaves.
const unpin = (e: Event) => {
  Reflect.deleteProperty(e, "target");
  Reflect.deleteProperty(e, "currentTarget");
};

// A widget overlay portalled to the body walks back into the closed root on the document pass; a stopped walk pins there.
// Installed at load, before any widget bundle can register a document listener that would run ahead of it.
if (typeof document !== "undefined") {
  const events = [...DelegatedEvents];
  delegateEvents(events);
  for (const name of events) document.addEventListener(name, unpin, { passive: true });
}

/**
 * Solid handlers inside a closed root run; anything a host renders into one it owns needs this.
 * Event types in `passive` are listened to passively, so they never hold up scrolling.
 */
export function delegateInside(
  shadow: ShadowRoot,
  passive: ReadonlySet<string> = new Set(),
): () => void {
  if (shadow.mode !== "closed") return () => {};
  const events = [...DelegatedEvents];
  // Solid listens on whatever it is handed; this hands it the root, passive where asked.
  const root = {
    addEventListener: (type: string, listener: EventListener) =>
      shadow.addEventListener(type, listener, { passive: passive.has(type) }),
    removeEventListener: (type: string, listener: EventListener) =>
      shadow.removeEventListener(type, listener),
  } as unknown as Document;
  delegateEvents(events, root);
  for (const name of events) shadow.addEventListener(name, unpin, { passive: true });
  return () => {
    clearDelegatedEvents(root);
    for (const name of events) shadow.removeEventListener(name, unpin);
  };
}
