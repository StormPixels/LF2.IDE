// Editor: textarea transparan + lapisan <pre> berwarna yang HANYA berisi baris yang terlihat (cepat untuk file besar)
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
const KW = {};
const kwOf = lang => KW[lang] ??= (() => {
  const L = LANG[lang] || LANG.object_dat, m = new Map();
  for (const [l, w] of Object.entries(L.keywords)) w.forEach(x => m.set(x.toLowerCase(), 'k' + l));
  return m;
})();

export function highlight(text, lang) {
  const kw = kwOf(lang), L = LANG[lang] || LANG.object_dat, cm = L.lineComment || '#';
  return text.split('\n').map(line => {
    const ci = line.indexOf(cm), code = ci >= 0 ? line.slice(0, ci) : line;
    const tail = ci >= 0 ? `<span class="cm">${esc(line.slice(ci))}</span>` : '';
    return code.replace(/(<?)(\w+)(>?:?)|(-?\d+)|([^<\w-]+|-|<)/g, (m, a, w, b, n) => {
      if (n !== undefined) return `<span class="nm">${n}</span>`;
      if (w === undefined) return esc(m);
      const c = kw.get(w.toLowerCase()); return c ? `${esc(a)}<span class="${c}">${w}</span>${esc(b)}` : esc(m);
    }) + tail;
  }).join('\n') + '\n';
}

const LH = 19, PAD = 8, OVER = 12;
export function createEditor(host, { text, lang, onChange, onCursor }) {
  const box = document.createElement('div'); box.className = 'ed';
  const pre = document.createElement('pre'), ta = document.createElement('textarea');
  ta.value = text; ta.spellcheck = false; ta.autocapitalize = 'off'; ta.setAttribute('autocomplete', 'off');
  box.append(pre, ta); host.appendChild(box);
  let lines = text.split('\n'), raf = 0;
  const draw = () => {
    const top = ta.scrollTop, h = ta.clientHeight || 600;
    const a = Math.max(0, Math.floor(top / LH) - OVER), b = Math.min(lines.length, Math.ceil((top + h) / LH) + OVER);
    pre.innerHTML = highlight(lines.slice(a, b).join('\n'), lang);
    pre.style.transform = `translate(${PAD - ta.scrollLeft}px,${PAD + a * LH - top}px)`;
  };
  const sched = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  const cursor = () => {
    const off = ta.selectionStart, v = ta.value.slice(0, off);
    onCursor?.((v.match(/\n/g) || []).length + 1, off - v.lastIndexOf('\n'), off);
  };
  const changed = () => { lines = ta.value.split('\n'); draw(); onChange?.(); };
  ta.addEventListener('input', changed);
  ta.addEventListener('scroll', sched);
  ['keyup', 'click', 'focus'].forEach(e => ta.addEventListener(e, cursor));
  new ResizeObserver(sched).observe(box);
  draw();
  return {
    el: box, get value() { return ta.value; }, set value(v) { ta.value = v; lines = v.split('\n'); draw(); },
    get offset() { return ta.selectionStart; },
    replaceRange(s, e, str) { ta.setRangeText(str, s, e, 'preserve'); changed(); },
    goto(off) {
      ta.setSelectionRange(off, off);
      const line = (ta.value.slice(0, off).match(/\n/g) || []).length;
      ta.scrollTop = Math.max(0, (line - 2) * LH); draw(); cursor();
    },
    show(on) { box.classList.toggle('on', on); if (on) { draw(); cursor(); } }, focus: () => ta.focus(),
  };
}
