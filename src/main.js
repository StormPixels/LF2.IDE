import { createDesign } from './ui/design.js';
import { initLayout } from './ui/layout.js';
import { createExplorer } from './ui/explorer.js';
import { createEditor, langFor } from './ui/editor.js';
import { pickFolder, pickFiles, readBytes, saveBytes } from './platform/files.js';
import { decrypt, encrypt } from './core/crypto.js';
import { getFrames } from './core/tokenizer.js';
import { readFrame } from './core/frameParser.js';

const $ = id => document.getElementById(id), docs = [];
let cur = null;
const layout = initLayout();
const design = createDesign($('design'));
const explorer = createExplorer($('tree'), e => openEntry(e));

const looksPlain = t => /<bmp_begin>|<frame>|<stage>|<background>|^\s*#|\bname:/m.test(t);
function info0(d) {
  const f = getFrames(d.ed.value); let bad = 0; f.forEach(x => { try { if (!readFrame(x)) bad++; } catch { bad++; } });
  $('stInfo').textContent = `${f.length} frame${bad ? `, ${bad} error` : ''}${d.encrypted ? ' · terenkripsi' : ''}`;
}
let it; const info = d => { clearTimeout(it); it = setTimeout(() => (window.requestIdleCallback || setTimeout)(() => info0(d)), 900); };
function renderTabs() {
  $('tabs').innerHTML = '';
  docs.forEach(d => {
    const t = document.createElement('div'); t.className = 'tab' + (d === cur ? ' on' : '');
    t.textContent = (d.dirty ? '● ' : '') + d.name; const x = document.createElement('b'); x.textContent = '×'; t.appendChild(x);
    t.onclick = e => e.target === x ? close(d) : activate(d); $('tabs').appendChild(t);
  });
}
function activate(d) { cur = d; docs.forEach(o => o.ed.show(o === d)); renderTabs(); if (d) info(d); else $('stInfo').textContent = ''; design.follow(d?.ed); }
function close(d) { if (d.dirty && !confirm(`Tutup ${d.name} tanpa menyimpan?`)) return; d.ed.el.remove(); docs.splice(docs.indexOf(d), 1); activate(docs[docs.length - 1] || null); }
function addDoc(name, text, encrypted) {
  const d = { name, encrypted, dirty: false };
  d.ed = createEditor($('editorHost'), { text, lang: langFor(name, text),
    onChange: () => { if (!d.dirty) { d.dirty = true; renderTabs(); } info(d); },
    onCursor: (l, c) => { $('stPos').textContent = `Ln ${l}, Col ${c}`; if (d === cur) design.follow(d.ed); } });
  docs.push(d); activate(d); layout.closeDrawer(); d.ed.focus();
}
async function openEntry({ path, file }) {
  if (/\.(bmp|png|gif|jpe?g)$/i.test(path)) { await design.addSprites([file]); $('stInfo').textContent = 'Sprite dimuat: ' + file.name; return; }
  const bytes = await readBytes(file), name = path.split('/').pop();
  let text = new TextDecoder('latin1').decode(bytes), enc = false;
  if (/\.(dat|txt)$/i.test(name) && !looksPlain(text)) { text = decrypt(bytes); enc = true; }
  addDoc(name, text, enc);
}
$('btnOpenFolder').onclick = async () => { const l = await pickFolder(); if (l.length) { explorer.set(l); design.addSprites(l.filter(e => /\.(bmp|png)$/i.test(e.path)).map(e => e.file)); } };
$('btnOpenFile').onclick = async () => { for (const e of await pickFiles()) await openEntry(e); };
$('btnDesign').onclick = () => { document.body.classList.toggle('des'); design.follow(cur?.ed); };
$('btnNew').onclick = async () => { const r = await fetch('src/templates/Char.dat'); addDoc('Baru.dat', await r.text(), false); };
$('btnSave').onclick = async () => {
  if (!cur) return; const t = cur.ed.value;
  try {
    const where = await saveBytes(cur.name, cur.encrypted ? encrypt(t) : Uint8Array.from(t, c => c.charCodeAt(0) & 255));
    cur.dirty = false; renderTabs(); $('stInfo').textContent = 'Tersimpan: ' + where;
  } catch (e) { alert('Gagal menyimpan: ' + (e.message || e)); }
};

window.__lf2ok = true;
