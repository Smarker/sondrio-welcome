export function seasonForMonth(m){ return (m >= 11 || m <= 3) ? 'winter' : 'summer'; }

export function applySeason(season, doc = document){
  doc.querySelectorAll('.szbtn').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.season === season)));
  doc.querySelectorAll('#acts .act').forEach(a => {
    const show = a.dataset.season === season || a.dataset.season === 'all';
    a.classList.toggle('hide', !show);
  });
}

export function initSeasons(){
  document.querySelectorAll('.szbtn').forEach(b =>
    b.addEventListener('click', () => applySeason(b.dataset.season)));
  applySeason(seasonForMonth(new Date().getMonth() + 1));
}
