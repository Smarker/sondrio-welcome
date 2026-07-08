// Floating "Sections" menu: a pinned button that opens a quick jump-to list.

export function initSections(){
  const nav = document.querySelector('.sectionsnav');
  const btn = document.getElementById('sectionsToggle');
  const menu = document.getElementById('sectionsMenu');
  if (!nav || !btn || !menu) return;

  const open = () => { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); };
  const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  const toggle = () => (menu.hidden ? open() : close());

  btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  // jumping to a section closes the menu (the anchor href does the scrolling)
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  // dismiss on outside click or Escape
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
