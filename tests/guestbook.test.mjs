import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, guestbookHtml } from '../js/guestbook.js';

test('escapeHtml neutralizes angle brackets and ampersands', () => {
  assert.equal(escapeHtml('<b>&"x"</b>'), '&lt;b&gt;&amp;&quot;x&quot;&lt;/b&gt;');
});
test('empty entries render the empty state', () => {
  const html = guestbookHtml([], 'Be the first');
  assert.match(html, /Be the first/);
  assert.doesNotMatch(html, /gbnote/);
});
test('entries render one note each with escaped text', () => {
  const html = guestbookHtml([
    { name:'Ana', note:'Lovely <3', date:'2026-06' },
    { name:'Bo', note:'Great', date:'2026-05' },
  ], 'empty');
  assert.equal((html.match(/gbnote/g) || []).length, 2);
  assert.match(html, /Lovely &lt;3/);
  assert.match(html, /Ana/);
});
