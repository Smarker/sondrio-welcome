export const QUICK_TARGETS = {
  door: '#card-arrival',
  wifi: '#card-wifi',
};

export function resolveTarget(key){
  return Object.prototype.hasOwnProperty.call(QUICK_TARGETS, key) ? QUICK_TARGETS[key] : null;
}

export function scrollToTarget(doc, selector, options = {}){
  if (options.beforeScroll) options.beforeScroll();
  const el = doc.querySelector(selector);
  if (!el) return null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  return el;
}

export function initQuickAccess(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.qpill[data-quick]').forEach(pill => {
    pill.addEventListener('click', () => {
      const sel = resolveTarget(pill.dataset.quick);
      if (!sel) return;
      scrollToTarget(document, sel, {
        beforeScroll(){
          if (pill.dataset.quick === 'door'){
            document.querySelector('#card-arrival .adbtn[data-ad="arrival"]')?.click();
          }
        },
      });
      const locked = !document.getElementById('app')?.classList.contains('unlocked');
      if (locked){
        const input = document.getElementById('unlockInput');
        if (input) setTimeout(() => input.focus({ preventScroll: true }), reduce ? 0 : 500);
      }
    });
  });
}
