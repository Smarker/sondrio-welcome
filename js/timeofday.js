import { T } from './content.js';

export function phaseForHour(h){
  if (h >= 21 || h < 6) return 'night';
  if (h < 8 || h >= 18) return 'golden';
  return 'day';
}

export function greetingKeyForHour(h){
  if (h >= 5 && h < 12) return 'greetMorning';
  if (h >= 12 && h < 18) return 'greetAfternoon';
  return 'greetEvening';
}

export function sondrioNow(date = new Date()){
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(date);
  const get = t => Number(parts.find(p => p.type === t).value);
  let hour = get('hour');
  if (hour === 24) hour = 0; // some engines emit 24 for midnight
  return { hour, minute: get('minute') };
}

export function applyTimeOfDay(doc = document, date = new Date()){
  const { hour } = sondrioNow(date);
  doc.documentElement.setAttribute('data-tod', phaseForHour(hour));

  const lang = doc.documentElement.lang || 'en';
  const greetEl = doc.querySelector('[data-greeting]');
  if (greetEl){
    const key = greetingKeyForHour(hour);
    greetEl.setAttribute('data-t', key); // so language switches re-translate it
    if (T[key] && T[key][lang]) greetEl.textContent = T[key][lang];
  }
}

export function initTimeOfDay(){
  applyTimeOfDay();
  setInterval(() => applyTimeOfDay(), 60000);
}
