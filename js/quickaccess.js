export function scrollToTarget(doc, selector, options = {}){
  if (options.beforeScroll) options.beforeScroll();
  const el = doc.querySelector(selector);
  if (!el) return null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  return el;
}
