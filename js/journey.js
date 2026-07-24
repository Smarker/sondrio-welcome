import { T } from './content.js';
import { showPane } from './arrival.js';
import { sondrioNow } from './timeofday.js';
import { scrollToTarget } from './quickaccess.js';
export const JOURNEY_STORAGE = 'sw-journey';
export const JOURNEY_PHASE_KEY = 'sw-journey-phase-key';
export const TIP_DISMISSED_KEY = 'sw-journey-tip-dismissed';

const NAV_PHASES = ['welcome', 'arrive', 'stay', 'leave'];

export function dateKeyInSondrio(date = new Date()){
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(date);
}

export function phaseForStay(today, checkIn, checkOut){
  if (!checkIn || !checkOut) return 'stay';
  if (today < checkIn) return 'welcome';
  if (today === checkIn) return 'arrive';
  if (today === checkOut) return 'leave';
  if (today > checkOut) return 'after';
  return 'stay';
}

export function parseStayConfig(data){
  if (!data || typeof data !== 'object') return null;
  const { checkIn, checkOut } = data;
  if (!checkIn || !checkOut) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) return null;
  if (checkOut <= checkIn) return null;
  return { checkIn, checkOut };
}

export function navPhaseFor(phase){
  return phase === 'after' ? 'leave' : phase;
}

export function resolvePhase(stay, now = new Date(), override = null){
  const today = dateKeyInSondrio(now);
  const computed = stay ? phaseForStay(today, stay.checkIn, stay.checkOut) : 'stay';
  if (override && NAV_PHASES.includes(override)) return override;
  return computed;
}

export function heroSubKeyForPhase(phase){
  const keys = {
    welcome: 'heroSubWelcome',
    arrive: 'heroSubArrive',
    stay: 'heroSubStay',
    leave: 'heroSubLeave',
    after: 'heroSubAfter',
  };
  return keys[phase] || 'heroSub';
}

export function welcomeNoteKeyForPhase(phase){
  return phase === 'welcome' ? 'welcomeNoteWelcome' : 'welcomeNote';
}

export function formatStayDates(stay, lang = 'en'){
  if (!stay || !stay.checkIn || !stay.checkOut) return '';
  const locale = lang === 'en' ? 'en-GB' : lang; // day-first everywhere
  const day = s => new Date(`${s}T12:00:00`);
  const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' });
  if (stay.checkIn.slice(0, 7) === stay.checkOut.slice(0, 7)){
    const dayOnly = new Intl.DateTimeFormat(locale, { day: 'numeric' });
    return `${dayOnly.format(day(stay.checkIn))}–${dayMonth.format(day(stay.checkOut))}`;
  }
  return `${dayMonth.format(day(stay.checkIn))} – ${dayMonth.format(day(stay.checkOut))}`;
}

export function visibleForPhase(el, phase){
  const allowed = (el.getAttribute('data-journey') || '').split(/\s+/).filter(Boolean);
  if (!allowed.length) return true;
  return allowed.includes(phase);
}

export function tipKeyForHour(h){
  if (h >= 5 && h < 12) return 'jTipMorning';
  if (h >= 12 && h < 18) return 'jTipDay';
  return 'jTipEvening';
}

export function tipTargetForHour(h){
  if (h >= 5 && h < 12) return '#card-daytrips';
  if (h >= 12 && h < 18) return '#card-explore';
  return '#card-eat';
}

export function applyJourney(doc, phase, options = {}){
  const journey = navPhaseFor(phase);
  doc.documentElement.setAttribute('data-journey', journey);

  const lang = doc.documentElement.lang || 'en';

  const heroSub = doc.querySelector('[data-hero-sub]');
  if (heroSub){
    const key = heroSubKeyForPhase(phase);
    heroSub.setAttribute('data-t', key);
    if (T[key] && T[key][lang]) heroSub.textContent = T[key][lang];
  }

  const stayDates = doc.querySelector('[data-stay-dates]');
  if (stayDates){
    const dates = formatStayDates(options.stay, lang);
    stayDates.hidden = !dates;
    if (dates) stayDates.textContent = `${(T.stayDatesLabel && T.stayDatesLabel[lang]) || ''} · ${dates}`;
  }

  const welcomeNote = doc.querySelector('#welcome-note p');
  if (welcomeNote){
    const key = welcomeNoteKeyForPhase(phase);
    welcomeNote.setAttribute('data-t', key);
    if (T[key] && T[key][lang]) welcomeNote.textContent = T[key][lang];
  }

  // .jpill buttons use data-journey as their target phase, not a visibility
  // list — leave them out of the phase filter or the nav hides itself.
  // Scoped to <body>: documentElement carries data-journey too (set above,
  // for CSS ordering), and querySelectorAll on doc would match it and hide
  // the whole page whenever phase !== journey (e.g. the 'after' phase).
  doc.body.querySelectorAll('[data-journey]:not(.jpill)').forEach(el => {
    el.hidden = !visibleForPhase(el, phase);
  });

  doc.querySelectorAll('.jpill').forEach(p =>
    p.setAttribute('aria-pressed', String(p.dataset.journey === journey)));

  const arrivalRoot = doc.getElementById('card-arrival');
  if (arrivalRoot){
    if (phase === 'leave') showPane(arrivalRoot, 'departure');
    else if (phase === 'arrive') showPane(arrivalRoot, 'arrival');
  }

  const tipEl = doc.querySelector('[data-journey-tip]');
  const tipText = doc.querySelector('[data-journey-tip-text]');
  if (tipEl && tipText){
    const dismissed = typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(TIP_DISMISSED_KEY);
    if (phase === 'stay' && !dismissed){
      const { hour } = sondrioNow();
      const tipKey = tipKeyForHour(hour);
      tipEl.hidden = false;
      tipEl.dataset.tipTarget = tipTargetForHour(hour);
      tipText.setAttribute('data-t', tipKey);
      if (T[tipKey] && T[tipKey][lang]) tipText.textContent = T[tipKey][lang];
    } else {
      tipEl.hidden = true;
    }
  }
}

export function getUrlPhase(){
  if (typeof location === 'undefined') return null;
  const view = new URLSearchParams(location.search).get('view');
  if (view && NAV_PHASES.includes(view)) return view;
  const hash = location.hash.replace('#', '');
  if (NAV_PHASES.includes(hash)) return hash;
  return null;
}

export async function fetchStayConfig(){
  try {
    const r = await fetch('data/stay.json');
    if (!r.ok) return null;
    return parseStayConfig(await r.json());
  } catch {
    return null;
  }
}

export function initJourney(stay){
  const today = dateKeyInSondrio();
  const computed = stay ? phaseForStay(today, stay.checkIn, stay.checkOut) : 'stay';
  const phaseKey = stay ? `${stay.checkIn}:${stay.checkOut}:${today}` : `none:${today}`;

  if (typeof sessionStorage !== 'undefined'){
    const storedKey = sessionStorage.getItem(JOURNEY_PHASE_KEY);
    if (storedKey !== phaseKey){
      sessionStorage.removeItem(JOURNEY_STORAGE);
      sessionStorage.setItem(JOURNEY_PHASE_KEY, phaseKey);
    }
  }

  const urlPhase = getUrlPhase();
  const storedOverride = typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem(JOURNEY_STORAGE) : null;
  const override = urlPhase || storedOverride;
  const phase = resolvePhase(stay, new Date(), override);

  if (urlPhase && typeof sessionStorage !== 'undefined'){
    sessionStorage.setItem(JOURNEY_STORAGE, urlPhase);
  }

  let viewPhase = phase;
  applyJourney(document, viewPhase, { stay });

  function setViewPhase(next){
    if (!NAV_PHASES.includes(next)) return;
    viewPhase = next;
    if (typeof sessionStorage !== 'undefined'){
      sessionStorage.setItem(JOURNEY_STORAGE, viewPhase);
    }
    applyJourney(document, viewPhase, { stay });
  }

  document.querySelectorAll('.jpill').forEach(pill => {
    pill.addEventListener('click', () => setViewPhase(pill.dataset.journey));
  });

  const tipEl = document.querySelector('[data-journey-tip]');
  if (tipEl){
    tipEl.addEventListener('click', e => {
      if (e.target.closest('[data-tip-dismiss]')){
        sessionStorage.setItem(TIP_DISMISSED_KEY, '1');
        tipEl.hidden = true;
        return;
      }
      const target = tipEl.dataset.tipTarget;
      if (target) scrollToTarget(document, target);
    });
  }

  document.querySelectorAll('.lang').forEach(b =>
    b.addEventListener('click', () => {
      applyJourney(document, viewPhase, { stay });
    }));

  // Used by send-off "See the other season" and similar deep links.
  document.addEventListener('sw:journey', e => {
    const next = e.detail?.phase;
    if (next) setViewPhase(next);
  });

  return { phase: viewPhase, computed, setViewPhase };
}
