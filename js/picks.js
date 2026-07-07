import { T } from './content.js';

// Each pick references existing localized item keys already in content.js.
export const PICKS = [
  { name:'actHike',    desc:'actHikeD' },
  { name:'actWine',    desc:'actWineD' },
  { name:'actTerme',   desc:'actTermeD' },
  { name:'actBernina', desc:'actBerninaD' },
  { name:'actClimb',   desc:'actClimbD' },
  { name:'actSki',     desc:'actSkiD' },
];

export function daysSinceEpoch(date){
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
}
export function pickForDate(date, pool){
  return pool[daysSinceEpoch(date) % pool.length];
}

export function initPicks(){
  const nameEl = document.querySelector('#todayspick [data-pick-name]');
  const descEl = document.querySelector('#todayspick [data-pick-desc]');
  if (!nameEl || !descEl) return;
  const pick = pickForDate(new Date(), PICKS);
  const lang = document.documentElement.lang || 'en';
  // set data-t so future language switches re-translate automatically
  nameEl.setAttribute('data-t', pick.name);
  descEl.setAttribute('data-t', pick.desc);
  if (T[pick.name] && T[pick.name][lang]) nameEl.textContent = T[pick.name][lang];
  if (T[pick.desc] && T[pick.desc][lang]) descEl.textContent = T[pick.desc][lang];
}
