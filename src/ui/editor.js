// Pengganti DocumentForm + ScintillaNET: textarea transparan di atas lapisan <pre> berwarna
import { LANG } from '../core/lang.js';

export function langFor(name, text = '') {
  const n = name.toLowerCase();
  if (n.endsWith('.as')) return 'as';
  if (n === 'data.txt') return 'data_txt';
  if (/stage/.test(n) || /<phase>/.test(text)) return 'stage_dat';
  if (/\bbg\b|background/.test(n)) return 'bg_dat';
  return 'object_dat';
}
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function highlight(text, lang) {
  const L = LANG[lang] || LANG.object_dat, kw = new Map();
  for (const [list, words] of Object.entries(L.keywords)) words.forEach(w => kw.set(w.toLowerCase(), 'k' + list));
  const cm = L.lineComment === '#' || !L.lineComment ? '#' : L.lineComment;
  return text.split('\n').map(line => {
    const ci = line.indexOf(cm), code = ci >= 0 ? line.slice(0, ci) : line, tail = ci >= 0 ? `<span class="cm">${esc(line.slice(ci))}</span>` : '';
    return code.replace(/(<?)(\w+)(>?:?)|(-?\d+)|([^<\w-]+|-|<)/g, (m, a, w, b, n, o) => {
      if (n !== undefined) return `<span class="nm">${n}</span>`;
      if (w === undefined) return esc(m);
      const c = kw.get(w.toLowerCase()); return c ? `${esc(a)}<span class="${c}">${w}</span>${esc(b)}` : esc(m);
    }) + tail;
  }).join('\n') + '\n';
}

export function createEditor(host, { text, lang, onChange, onCursor }) {
  const box = document.createElement('div'); box.className = 'ed';
  const pre = document.createElement('pre'), ta = document.createElement('textarea');
  ta.value = text; ta.spellcheck = false; ta.autocapitalize = 'off'; ta.setAttribute('autocomplete', 'off');
  box.append(pre, ta); host.appendChild(box);
  const draw = () => { pre.innerHTML = highlight(ta.value, lang); };
  const sync = () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; };
  const cursor = () => { const v = ta.value.slice(0, ta.selectionStart).split('\n'); onCursor?.(v.length, v[v.length - 1].length + 1); };
  ta.addEventListener('input', () => { draw(); onChange?.(); });
  ta.addEventListener('scroll', sync); ['keyup', 'click', 'focus'].forEach(e => ta.addEventListener(e, cursor));
  draw();
  return { el: box, get value() { return ta.value; }, set value(v) { ta.value = v; draw(); },
    show(on) { box.classList.toggle('on', on); if (on) { sync(); cursor(); } }, focus: () => ta.focus() };
}
