import { T } from './content.js';

const KEY = 'sw-checkout';
const ITEMS = ['dishwasher','keys']; // ids map to coItem2/3 copy
const COPY = { dishwasher:'coItem2', keys:'coItem3' };

export function loadState(storage){
  try { return JSON.parse(storage.getItem(KEY)) || {}; }
  catch { return {}; }
}
export function toggleState(state, id){
  return { ...state, [id]: !state[id] };
}
export function isComplete(state, ids){
  return ids.every(id => state[id] === true);
}

export function initCheckout(){
  const mount = document.getElementById('checkout');
  if (!mount) return;
  const lang = () => document.documentElement.lang || 'en';
  let state = loadState(localStorage);

  function render(){
    const t = k => (T[k] && T[k][lang()]) || '';
    mount.innerHTML =
      ITEMS.map(id => `
        <button class="coitem${state[id] ? ' done' : ''}" data-co="${id}" role="checkbox" aria-checked="${!!state[id]}">
          <span class="cobox"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-11"/></svg></span>
          <span class="colabel" data-t="${COPY[id]}">${t(COPY[id])}</span>
        </button>`).join('') +
      `<div class="codone${isComplete(state, ITEMS) ? ' show' : ''}" data-t="coDone">${t('coDone')}</div>`;
    mount.querySelectorAll('.coitem').forEach(btn => {
      btn.addEventListener('click', () => {
        state = toggleState(state, btn.dataset.co);
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
        render();
      });
    });
  }
  render();
}
