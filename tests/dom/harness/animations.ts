// happy-dom reports animationName as "", which solid-presence reads as an animation that never ends.
const realGetComputedStyle = window.getComputedStyle.bind(window);

window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
  const style = realGetComputedStyle(el, pseudo);
  if (style.animationName) return style;
  return new Proxy(style, {
    get: (target, key) => {
      if (key === "animationName") return "none";
      const value = Reflect.get(target, key);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}) as typeof window.getComputedStyle;
