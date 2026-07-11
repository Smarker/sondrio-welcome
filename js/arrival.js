// Arrival / Departure toggle inside the arrival card.
// Shows one pane at a time: arrival (check-in + door code) or departure
// (check-out + the before-you-go checklist). The card title matches the
// active pane ("Arrival" or "Departure").

import { T } from './content.js';

export function showPane(root, which){
  root.querySelectorAll('.adbtn').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.ad === which)));
  root.querySelectorAll('.adpane').forEach(p =>
    p.hidden = p.dataset.adPane !== which);
  const title = root.querySelector('.ctitle');
  if (title){
    const key = which === 'departure' ? 'tabDeparture' : 'tabArrival';
    title.setAttribute('data-t', key);
    const lang = document.documentElement.lang || 'en';
    if (T[key] && T[key][lang]) title.textContent = T[key][lang];
  }
}

export function initArrival(){
  const root = document.getElementById('card-arrival');
  if (!root) return;
  root.querySelectorAll('.adbtn').forEach(b =>
    b.addEventListener('click', () => showPane(root, b.dataset.ad)));
}
