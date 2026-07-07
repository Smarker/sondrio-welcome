// Arrival / Departure toggle inside the "Arrival & departure" card.
// Shows one pane at a time: arrival (check-in + door code) or departure
// (check-out + the before-you-go checklist).

export function showPane(root, which){
  root.querySelectorAll('.adbtn').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.ad === which)));
  root.querySelectorAll('.adpane').forEach(p =>
    p.hidden = p.dataset.adPane !== which);
}

export function initArrival(){
  const root = document.getElementById('card-arrival');
  if (!root) return;
  root.querySelectorAll('.adbtn').forEach(b =>
    b.addEventListener('click', () => showPane(root, b.dataset.ad)));
}
