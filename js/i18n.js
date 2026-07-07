import { T } from './content.js';
import { initSeasons, applySeason, seasonForMonth } from './seasons.js';
import { initUnlock } from './unlock.js';
import { initTimeOfDay } from './timeofday.js';
import { initQuickAccess } from './quickaccess.js';
import { initCheckout } from './checkout.js';
import { initPicks } from './picks.js';
import { initGuestbook } from './guestbook.js';
const AVAILABLE = ['it','en','es','fr','de'];

export function resolveLanguage(navLang, available = AVAILABLE){
  const code = String(navLang || '').toLowerCase().split('-')[0];
  return available.includes(code) ? code : 'en';
}

export function applyLanguage(lang, doc = document){
  doc.querySelectorAll('[data-t]').forEach(el => {
    const k = el.getAttribute('data-t');
    if (T[k] && T[k][lang]) el.textContent = T[k][lang];
  });
  doc.querySelectorAll('[data-t-placeholder]').forEach(el => {
    const k = el.getAttribute('data-t-placeholder');
    if (T[k] && T[k][lang]) el.placeholder = T[k][lang];
  });
  doc.querySelectorAll('.lang').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  doc.documentElement.lang = lang;
}

function initI18n(){
  const saved = localStorage.getItem('sw-lang');
  const lang = saved || resolveLanguage(navigator.language);
  applyLanguage(lang);
  document.querySelectorAll('.lang').forEach(b =>
    b.addEventListener('click', () => {
      localStorage.setItem('sw-lang', b.dataset.lang);
      applyLanguage(b.dataset.lang);
    }));
  initSeasons();
  initUnlock();
  initTimeOfDay();
  initQuickAccess();
  initCheckout();
  initPicks();
  initGuestbook();
  const nudge = document.getElementById('seasonNudge');
  if (nudge) nudge.addEventListener('click', () => {
    const pressed = document.querySelector('.szbtn[aria-pressed="true"]');
    const current = pressed ? pressed.dataset.season : seasonForMonth(new Date().getMonth() + 1);
    applySeason(current === 'winter' ? 'summer' : 'winter');
    document.getElementById('card-things')?.scrollIntoView({ behavior:'smooth', block:'start' });
  });
  const v = document.querySelector('.herovideo');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  if (v && (reduce || saveData)) { v.removeAttribute('autoplay'); v.pause?.(); }

  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold:0, rootMargin:'0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}
if (typeof document !== 'undefined') initI18n();
