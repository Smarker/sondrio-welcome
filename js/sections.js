// Floating "Sections" menu: a pinned button that opens a quick jump-to list.

import { T } from './content.js';
import { navPhaseFor } from './journey.js';
import { showPane } from './arrival.js';

const ITEMS = [
  { id: 'arrival', href: '#card-arrival', label: { default: 'tabArrival', leave: 'arrival' } },
  { id: 'peek', href: '#card-peek', label: { default: 'peekTitle' } },
  { id: 'explore', href: '#card-explore', label: { default: 'exploreTitle' } },
  { id: 'eat', href: '#card-eat', label: { default: 'eatTitle' } },
  { id: 'daytrips', href: '#card-daytrips', label: { default: 'dtTitle' } },
  { id: 'guestbook', href: '#card-guestbook', label: { default: 'gbTitle' } },
  { id: 'hosts', href: '#card-hosts', label: { default: 'navHosts', leave: 'hostNames' } },
  { id: 'emergency', href: '#card-emergency', label: { default: 'emTitle' } },
  { id: 'sendoff', href: '#sendoff', label: { default: 'soTitle' }, leaveOnly: true },
];

const ORDER = {
  default: ['arrival', 'peek', 'explore', 'eat', 'daytrips', 'guestbook', 'hosts', 'emergency'],
  leave: ['arrival', 'hosts', 'emergency', 'guestbook', 'sendoff', 'peek', 'explore', 'eat', 'daytrips'],
};

export function labelKeyForItem(item, phase){
  const nav = navPhaseFor(phase);
  return nav === 'leave' && item.label.leave ? item.label.leave : item.label.default;
}

export function sectionsOrderFor(phase){
  return navPhaseFor(phase) === 'leave' ? ORDER.leave : ORDER.default;
}

export function applySectionsMenu(doc, phase){
  const menu = doc.getElementById('sectionsMenu');
  if (!menu) return;

  const nav = navPhaseFor(phase);
  const lang = doc.documentElement.lang || 'en';
  const links = new Map(
    [...menu.querySelectorAll('a[data-section]')].map(a => [a.dataset.section, a]),
  );

  for (const item of ITEMS){
    const link = links.get(item.id);
    if (!link) continue;
    const show = !item.leaveOnly || nav === 'leave';
    link.hidden = !show;
    const key = labelKeyForItem(item, phase);
    link.setAttribute('data-t', key);
    if (T[key] && T[key][lang]) link.textContent = T[key][lang];
  }

  for (const id of sectionsOrderFor(phase)){
    const link = links.get(id);
    if (link && !link.hidden) menu.appendChild(link);
  }
}

export function initSections(){
  const nav = document.querySelector('.sectionsnav');
  const btn = document.getElementById('sectionsToggle');
  const menu = document.getElementById('sectionsMenu');
  if (!nav || !btn || !menu) return;

  const open = () => { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); };
  const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  const toggle = () => (menu.hidden ? open() : close());

  btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    if (link.dataset.section === 'arrival' &&
        document.documentElement.getAttribute('data-journey') === 'leave'){
      const root = document.getElementById('card-arrival');
      if (root) showPane(root, 'departure');
    }
    close();
  });
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
