import { T } from './content.js';

export function escapeHtml(s){
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function guestbookHtml(entries, emptyText){
  if (!Array.isArray(entries) || entries.length === 0){
    return `<div class="gbempty" data-t="gbEmpty">${escapeHtml(emptyText)}</div>`;
  }
  return entries.map(e => `
    <figure class="gbnote">
      <blockquote>${escapeHtml(e.note || '')}</blockquote>
      <figcaption><span class="gbname">${escapeHtml(e.name || '')}</span>${e.date ? `<span class="gbdate">${escapeHtml(e.date)}</span>` : ''}</figcaption>
    </figure>`).join('');
}

export function initGuestbook(){
  const wall = document.getElementById('guestbook');
  const lang = () => document.documentElement.lang || 'en';
  if (wall){
    const emptyText = () => (T.gbEmpty && T.gbEmpty[lang()]) || '';
    fetch('data/guestbook.json')
      .then(r => r.ok ? r.json() : [])
      .catch(() => [])
      .then(entries => { wall.innerHTML = guestbookHtml(entries, emptyText()); });
  }
  const cta = document.querySelector('[data-gb-cta]');
  const host = document.querySelector('[data-host-wa]');
  const num = (host && host.getAttribute('data-host-wa')) || '';
  const waHref = () => {
    const msg = encodeURIComponent((T.gbWaMsg && T.gbWaMsg[lang()]) || '');
    return num ? `https://wa.me/${num}?text=${msg}` : '#';
  };
  if (cta){
    cta.setAttribute('href', waHref());
    document.querySelectorAll('.lang').forEach(b =>
      b.addEventListener('click', () => cta.setAttribute('href', waHref())));
  }
}
