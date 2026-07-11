export function seasonForMonth(m){ return (m >= 11 || m <= 3) ? 'winter' : 'summer'; }

export function otherSeason(season){
  return season === 'winter' ? 'summer' : 'winter';
}

export function activeSeason(doc = document){
  const pressed = doc.querySelector('.szbtn[aria-pressed="true"]');
  return pressed?.dataset.season || seasonForMonth(new Date().getMonth() + 1);
}

export function applySeason(season, doc = document){
  doc.querySelectorAll('.szbtn').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.season === season)));
  doc.querySelectorAll('#acts .act').forEach(a => {
    const show = a.dataset.season === season || a.dataset.season === 'all';
    a.classList.toggle('hide', !show);
  });
}

export function goToOtherSeason(doc = document){
  const next = otherSeason(activeSeason(doc));
  // Seasonal activities live under Plan Excursions.
  doc.dispatchEvent(new CustomEvent('sw:journey', { detail: { phase: 'stay' } }));
  applySeason(next, doc);

  const target = doc.getElementById('season-acts') || doc.getElementById('card-explore');
  if (!target) return next;

  const reduce = typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Wait a frame so un-hidden layout is ready before scrolling.
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    const seasons = doc.querySelector('.seasons');
    seasons?.classList.remove('season-flash');
    // Retrigger CSS animation
    void seasons?.offsetWidth;
    seasons?.classList.add('season-flash');
  });
  return next;
}

export function initSendoff(){
  const nudge = document.getElementById('seasonNudge');
  if (!nudge) return;
  nudge.addEventListener('click', () => goToOtherSeason());
}

export function initSeasons(){
  document.querySelectorAll('.szbtn').forEach(b =>
    b.addEventListener('click', () => applySeason(b.dataset.season)));
  applySeason(seasonForMonth(new Date().getMonth() + 1));
  initSendoff();
}
