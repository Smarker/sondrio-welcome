import { T } from './content.js';
import { showPane } from './arrival.js';
import { sondrioNow } from './timeofday.js';
import { scrollToTarget } from './quickaccess.js';

export const JOURNEY_STORAGE = 'sw-journey';
export const JOURNEY_PHASE_KEY = 'sw-journey-phase-key';
export const TIP_DISMISSED_KEY = 'sw-journey-tip-dismissed';

export const PHASE_TARGETS = {
  welcome: '#card-peek',
  arrive: '#card-arrival',
  stay: '#card-explore',
  leave: '#card-arrival',
  after: '#card-guestbook',
};

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
  return phase === 'after' ? 'welcome' : phase;
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
  const nav = navPhaseFor(phase);
  doc.documentElement.setAttribute('data-journey', nav);

  const lang = doc.documentElement.lang || 'en';

  const heroSub = doc.querySelector('[data-hero-sub]');
  if (heroSub){
    const key = heroSubKeyForPhase(phase);
    heroSub.setAttribute('data-t', key);
    if (T[key] && T[key][lang]) heroSub.textContent = T[key][lang];
  }

  doc.querySelectorAll('.jpill').forEach(p =>
    p.setAttribute('aria-pressed', String(p.dataset.journey === nav)));

  const privacy = doc.querySelector('.privacy');
  const privacyText = doc.querySelector('.privacy .pt');
  if (privacy && privacyText){
    const preArrival = phase === 'welcome';
    privacy.classList.toggle('pre-arrival', preArrival);
    const key = preArrival ? 'privacyPreArrival' : 'privacyText';
    privacyText.setAttribute('data-t', key);
    if (T[key] && T[key][lang]) privacyText.textContent = T[key][lang];
  }

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

export function scrollToPhaseTarget(doc, phase){
  const selector = PHASE_TARGETS[phase] || PHASE_TARGETS.stay;
  scrollToTarget(doc, selector, {
    beforeScroll(){
      if (phase !== 'arrive' && phase !== 'leave') return;
      const root = doc.getElementById('card-arrival');
      if (root) showPane(root, phase === 'leave' ? 'departure' : 'arrival');
    },
  });
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

  let activePhase = phase;
  applyJourney(document, activePhase, { stay });

  document.querySelectorAll('.jpill').forEach(pill => {
    pill.addEventListener('click', () => {
      activePhase = pill.dataset.journey;
      if (typeof sessionStorage !== 'undefined'){
        sessionStorage.setItem(JOURNEY_STORAGE, activePhase);
      }
      applyJourney(document, activePhase, { stay });
      scrollToPhaseTarget(document, activePhase);
    });
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
      applyJourney(document, activePhase, { stay });
    }));

  return { phase: activePhase, computed };
}
