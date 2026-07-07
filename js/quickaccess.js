export const QUICK_TARGETS = {
  door: '#card-arrival',
  wifi: '#card-wifi',
};

export function resolveTarget(key){
  return Object.prototype.hasOwnProperty.call(QUICK_TARGETS, key) ? QUICK_TARGETS[key] : null;
}

export function initQuickAccess(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.qpill[data-quick]').forEach(pill => {
    pill.addEventListener('click', () => {
      const sel = resolveTarget(pill.dataset.quick);
      if (!sel) return;
      const el = document.querySelector(sel);
      if (!el) return;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      const locked = !document.getElementById('app')?.classList.contains('unlocked');
      if (locked){
        const input = document.getElementById('unlockInput');
        if (input) setTimeout(() => input.focus(), reduce ? 0 : 500);
      }
    });
  });

  const heroDir = document.querySelector('.directions');
  const pillDir = document.querySelector('[data-quick-directions]');
  if (heroDir && pillDir) pillDir.setAttribute('href', heroDir.getAttribute('href') || '#');
}
