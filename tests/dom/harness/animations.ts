// happy-dom reports animationName as "", which solid-presence reads as an animation that never ends.
const realGetComputedStyle = window.getComputedStyle.bind(window);

window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
  const style = realGetComputedStyle(el, pseudo);
  if (style.animationName) return style;
  return new Proxy(style, {
    get: (target, key) =>
      key === "animationName" ? "none" : Reflect.get(target, key as keyof CSSStyleDeclaration),
  });
}) as typeof window.getComputedStyle;
