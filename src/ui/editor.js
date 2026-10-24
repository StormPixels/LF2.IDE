// Editor: textarea transparan + lapisan <pre> berwarna berisi jendela baris yang terlihat.
// Cepat: jendela baru digambar hanya saat scroll keluar dari penyangga; baris yang sama memakai cache HTML.
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

export function highlightLine(line, lang) {
  const kw = kwOf(lang), L = LANG[lang] || LANG.object_dat, cm = L.lineComment || '#';
  const ci = line.indexOf(cm), code = ci >= 0 ? line.slice(0, ci) : line;
  const tail = ci >= 0 ? `<span class="cm">${esc(line.slice(ci))}</span>` : '';
  return code.replace(/(<?)(\w+)(>?:?)|(-?\d+)|([^<\w-]+|-|<)/g, (m, a, w, b, n) => {
    if (n !== undefined) return `<span class="nm">${n}</span>`;
    if (w === undefined) return esc(m);
    const c = kw.get(w.toLowerCase()); return c ? `${esc(a)}<span class="${c}">${w}</span>${esc(b)}` : esc(m);
  }) + tail;
}
export const highlight = (text, lang) => text.split('\n').map(l => highlightLine(l, lang)).join('\n') + '\n';

const LH = 19, PAD = 8, BUF = 40, MARGIN = 15;
// Teks utuh disimpan di `lines`; <textarea> hanya berisi jendela [A,B) di sekitar layar,
// sehingga edit/layout tetap cepat walau file ribuan baris. Scroll memakai scroll native pada .ed.
export function createEditor(host, { text, lang, onChange, onCursor }) {
  const box = document.createElement('div'); box.className = 'ed';
  const sp = document.createElement('div'), pre = document.createElement('pre'), ta = document.createElement('textarea');
  sp.className = 'sp'; ta.spellcheck = false; ta.autocapitalize = 'off'; ta.setAttribute('autocomplete', 'off');
  box.append(sp, pre, ta); host.appendChild(box);
  let lines = [], str = '', A = 0, B = 0, base = 0, caret = 0, maxLen = 0, comp = false, raf = 0, ct = 0;
  const cache = new Map();
  const hl = l => { let h = cache.get(l); if (h === undefined) { if (cache.size > 6000) cache.clear(); h = highlightLine(l, lang); cache.set(l, h); } return h; };
  const textOf = () => str ??= lines.join('\n');
  const baseOf = a => { let o = 0; for (let i = 0; i < a; i++) o += lines[i].length + 1; return o; };
  const fit = () => {
    const w = `calc(${maxLen}ch + ${2 * PAD + 24}px)`;
    sp.style.height = (lines.length * LH + 2 * PAD) + 'px'; sp.style.width = ta.style.width = pre.style.width = w;
  };
  function mount(force, saveCaret = true) {
    const top = box.scrollTop, h = box.clientHeight || 600;
    const first = Math.max(0, Math.floor((top - PAD) / LH)), last = Math.ceil((top + h - PAD) / LH);
    if (!force && !((first < A + MARGIN && A > 0) || (last > B - MARGIN && B < lines.length))) return;
    if (comp) return;
    if (saveCaret && document.activeElement === ta) caret = base + ta.selectionStart;
    A = Math.max(0, first - BUF); B = Math.min(lines.length, last + BUF); base = baseOf(A);
    ta.value = lines.slice(A, B).join('\n'); pre.innerHTML = lines.slice(A, B).map(hl).join('\n') + '\n';
    ta.style.top = pre.style.top = (PAD + A * LH) + 'px'; ta.style.height = ((B - A + 1) * LH) + 'px';
    if (caret >= base && caret <= base + ta.value.length) ta.setSelectionRange(caret - base, caret - base);
  }
  function setText(t) {
    lines = t.split('\n'); str = t; maxLen = 0; for (const l of lines) if (l.length > maxLen) maxLen = l.length;
    fit(); mount(true);
  }
  const emit = () => {
    const t = textOf(), v = t.slice(0, caret);
    onCursor?.((v.match(/\n/g) || []).length + 1, caret - v.lastIndexOf('\n'), caret);
  };
  const cursor = () => { caret = base + ta.selectionStart; clearTimeout(ct); ct = setTimeout(emit, 80); };
  ta.addEventListener('input', () => {
    const nl = ta.value.split('\n'); lines.splice(A, B - A, ...nl); B = A + nl.length; str = null; caret = base + ta.selectionStart;
    for (const l of nl) if (l.length > maxLen) maxLen = l.length;
    pre.innerHTML = nl.map(hl).join('\n') + '\n'; ta.style.height = ((B - A + 1) * LH) + 'px'; fit();
    onChange?.(); cursor();
  });
  ta.addEventListener('keydown', e => {   // Ctrl+Home/End: lompat ke awal/akhir FILE (bukan jendela textarea)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'End' || e.key === 'Home')) { e.preventDefault(); api.goto(e.key === 'End' ? textOf().length : 0); ta.focus(); }
  });
  ta.addEventListener('compositionstart', () => { comp = true; });
  ta.addEventListener('compositionend', () => { comp = false; });
  box.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => mount(false)); });
  ['keyup', 'click', 'focus', 'select'].forEach(e => ta.addEventListener(e, cursor));
  new ResizeObserver(() => mount(true)).observe(box);
  setText(text);
  const api = {
    el: box, get value() { return textOf(); }, set value(v) { setText(v); }, get offset() { return caret; },
    replaceRange(s, e, r) { const t = textOf(); setText(t.slice(0, s) + r + t.slice(e)); onChange?.(); },
    goto(off) {
      const line = (textOf().slice(0, off).match(/\n/g) || []).length;
      box.scrollTop = Math.max(0, (line - 2) * LH + PAD); caret = off; mount(true, false); emit();
    },
    show(on) { box.classList.toggle('on', on); if (on) { mount(true); emit(); } }, focus: () => ta.focus(),
  };
  box.__ed = api; return api;
}
