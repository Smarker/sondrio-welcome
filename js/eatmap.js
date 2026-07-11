// "Where to eat" interactive map: one Google Maps embed. The "show all" view
// is the host's Google My Maps (custom pins) when a map id is configured on
// <div class="eatmap" data-mymap="…">, otherwise a walking route across every
// listed place. Tapping a restaurant row re-centres the map on that place;
// the "Show all on map" pill brings the overview back.

export function eatEmbedUrl(query, lang = 'en'){
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=${encodeURIComponent(lang)}&output=embed`;
}

export function myMapsEmbedUrl(mid){
  return mid ? `https://www.google.com/maps/d/embed?mid=${encodeURIComponent(mid)}` : '';
}

export function eatRouteUrl(queries, lang = 'en'){
  if (!Array.isArray(queries) || queries.length === 0) return '';
  if (queries.length === 1) return eatEmbedUrl(queries[0], lang);
  const [first, ...rest] = queries;
  return `https://www.google.com/maps?saddr=${encodeURIComponent(first)}` +
    `&daddr=${rest.map(encodeURIComponent).join('+to:')}` +
    `&dirflg=w&hl=${encodeURIComponent(lang)}&output=embed`;
}

export function initEatMap(doc = document){
  const card = doc.getElementById('card-eat');
  if (!card) return;
  const frame = card.querySelector('.eatmap iframe');
  const rows = [...card.querySelectorAll('.eat[data-map-q]')];
  if (!frame || rows.length === 0) return;

  const allBtn = card.querySelector('[data-eat-all]');
  const queries = rows.map(r => r.dataset.mapQ);
  const mid = card.querySelector('.eatmap')?.dataset.mymap || '';
  const lang = () => doc.documentElement.lang || 'en';

  function showAll(){
    rows.forEach(r => r.classList.remove('active'));
    allBtn?.setAttribute('aria-pressed', 'true');
    frame.src = myMapsEmbedUrl(mid) || eatRouteUrl(queries, lang());
  }

  function select(row){
    rows.forEach(r => r.classList.toggle('active', r === row));
    allBtn?.setAttribute('aria-pressed', 'false');
    frame.src = eatEmbedUrl(row.dataset.mapQ, lang());
  }

  rows.forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('a')) return; // "Open map" stays a normal link
      select(row);
    });
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){
        if (e.target.closest('a')) return;
        e.preventDefault();
        select(row);
      }
    });
  });

  if (allBtn){
    allBtn.hidden = queries.length < 2;
    allBtn.addEventListener('click', showAll);
  }

  showAll();
}
