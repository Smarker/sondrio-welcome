import { T } from './content.js';
import { initSeasons } from './seasons.js';
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
}
if (typeof document !== 'undefined') initI18n();
