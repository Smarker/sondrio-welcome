export function peekCaption(slot){
  const label = slot.querySelector('.slotlabel');
  const shot = slot.querySelector('.shot');
  return label?.textContent?.trim() || shot?.alt?.trim() || '';
}

// Wrap-around step through the gallery: stepIndex(2, 1, 3) → 0.
export function stepIndex(current, delta, length){
  if (!length) return 0;
  return (current + delta + length) % length;
}

export function initPeekLightbox(doc = document){
  const gallery = doc.querySelector('.gallery.mosaic');
  if (!gallery) return;

  const dialog = doc.createElement('dialog');
  dialog.className = 'peeklightbox';
  dialog.innerHTML = `
    <button type="button" class="peeklightbox-close" aria-label="Close">&times;</button>
    <button type="button" class="peeklightbox-nav peeklightbox-prev" aria-label="Previous photo">&#8249;</button>
    <button type="button" class="peeklightbox-nav peeklightbox-next" aria-label="Next photo">&#8250;</button>
    <figure class="peeklightbox-fig">
      <img class="peeklightbox-img" alt="">
      <figcaption class="peeklightbox-cap"></figcaption>
    </figure>`;
  doc.body.appendChild(dialog);

  const img = dialog.querySelector('.peeklightbox-img');
  const cap = dialog.querySelector('.peeklightbox-cap');

  const slots = [...gallery.querySelectorAll('.slot')].filter(s => s.querySelector('.shot'));
  let current = 0;

  function show(index){
    current = stepIndex(index, 0, slots.length);
    const slot = slots[current];
    const shot = slot.querySelector('.shot');
    img.src = shot.currentSrc || shot.src;
    const caption = peekCaption(slot);
    img.alt = caption || shot.alt || '';
    cap.textContent = caption;
  }

  function open(index){
    show(index);
    dialog.showModal();
  }

  function step(delta){
    show(stepIndex(current, delta, slots.length));
  }

  function close(){
    if (dialog.open) dialog.close();
  }

  slots.forEach((slot, i) => {
    slot.classList.add('peekslot');
    slot.setAttribute('role', 'button');
    slot.setAttribute('tabindex', '0');
    slot.addEventListener('click', () => open(i));
    slot.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(i);
      }
    });
  });

  const prev = dialog.querySelector('.peeklightbox-prev');
  const next = dialog.querySelector('.peeklightbox-next');
  if (slots.length < 2){
    prev.hidden = true;
    next.hidden = true;
  }
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));

  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft'){ e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); step(1); }
  });

  // swipe between photos on touch screens
  let touchX = null;
  dialog.addEventListener('touchstart', e => { touchX = e.touches[0]?.clientX ?? null; }, { passive: true });
  dialog.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
    touchX = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  dialog.querySelector('.peeklightbox-close').addEventListener('click', close);
  dialog.addEventListener('click', e => { if (e.target === dialog) close(); });
}
