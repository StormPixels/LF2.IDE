// Panel Design (pengganti FormFrame/TagBox/DrawBox): kotak bdy/itr + titik, edit properti, sinkron ke kode
import { readFrame } from '../core/frameParser.js';
import { SCHEMA, frameToString } from '../core/models.js';

const COL = { bdy: '#2fbf5f', itr: '#e0443e', wpoint: '#e0a020', opoint: '#3b82f6', cpoint: '#a855f7', bpoint: '#14b8a6' };
const SHOW = [['bdy', 'bdy'], ['itr', 'itr'], ['wpoint', 'w'], ['opoint', 'o'], ['cpoint', 'c'], ['bpoint', 'b'], ['center', 'center']];
const POINTS = ['wpoint', 'opoint', 'cpoint', 'bpoint'];
const NEW = { itr: { kind: 0, x: 20, y: 20, w: 30, h: 30, injury: 10 }, bdy: { kind: 0, x: 20, y: 20, w: 30, h: 30 } };

export function createDesign(el) {
  el.innerHTML = `<div class="dh"><b>Design</b><input id="dIdx" type="number" min="0"><input id="dCap" placeholder="caption"></div>
  <div class="dv">${SHOW.map(([k, l]) => `<label><input type="checkbox" data-v="${k}" checked>${l}</label>`).join('')}</div>
  <canvas id="dCv"></canvas>
  <div class="db"><button data-a="pull">↻ Muat</button><button data-a="itr">+itr</button><button data-a="bdy">+bdy</button><button data-a="del">Hapus</button></div>
  <div class="df" id="dForm"></div>`;
  const $ = s => el.querySelector(s), cv = $('#dCv'), ctx = cv.getContext('2d');
  let ed = null, f = null, rg = null, sel = null, S = 3, drag = null, tm = 0;
  const vis = Object.fromEntries(SHOW.map(([k]) => [k, true]));
  const selObj = () => !f || !sel ? null : sel.type === 'itr' ? f.itrs?.[sel.i] : sel.type === 'bdy' ? f.bdys?.[sel.i] : f[sel.type];

  function draw() {
    const w = Math.max(200, el.clientWidth - 16);
    if (Math.abs(cv.width - w) > 2) { cv.width = w; cv.height = Math.round(w * 110 / 120); S = w / 120; }
    ctx.clearRect(0, 0, cv.width, cv.height); if (!f) return;
    if (vis.center && f.centerx != null) {
      ctx.strokeStyle = '#e0443e'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(f.centerx * S, 0); ctx.lineTo(f.centerx * S, cv.height);
      ctx.moveTo(0, f.centery * S); ctx.lineTo(cv.width, f.centery * S); ctx.stroke();
    }
    for (const t of ['bdy', 'itr']) if (vis[t]) (f[t + 's'] || []).forEach((o, i) => {
      const on = sel && sel.type === t && sel.i === i;
      ctx.fillStyle = COL[t] + '44'; ctx.strokeStyle = on ? '#fff' : COL[t]; ctx.lineWidth = on ? 2.5 : 1;
      ctx.fillRect(o.x * S, o.y * S, o.w * S, o.h * S); ctx.strokeRect(o.x * S, o.y * S, o.w * S, o.h * S);
    });
    for (const t of POINTS) { const o = f[t]; if (!vis[t] || !o) continue;
      ctx.fillStyle = COL[t]; ctx.beginPath(); ctx.arc(o.x * S, o.y * S, sel && sel.type === t ? 7 : 4, 0, 7); ctx.fill(); }
  }
  function form() {
    const o = selObj(), box = $('#dForm');
    if (!o) { box.innerHTML = '<i>Ketuk kotak atau titik di kanvas untuk memilih</i>'; return; }
    const s = SCHEMA[sel.type], nm = (sel.type === 'itr' || sel.type === 'bdy') ? `${sel.type} #${sel.i + 1}` : sel.type;
    let h = `<div class="dt">${nm}</div>`;
    s.fields.forEach(([k, t]) => { const v = o[k]; h += `<label>${k}<input data-k="${k}" data-t="${t}" type="number" value="${v == null ? '' : t === 'b' ? +v : v}"></label>`; });
    (s.pairs || []).forEach(([k, p, q]) => { h += `<label>${k}<input data-k="${p}" data-t="i" type="number" value="${o[p] ?? ''}"><input data-k="${q}" data-t="i" type="number" value="${o[q] ?? ''}"></label>`; });
    box.innerHTML = h;
  }
  function hit(x, y) {
    for (const t of POINTS) { const o = f[t]; if (vis[t] && o && Math.hypot(o.x - x, o.y - y) <= 6) return { type: t, i: 0 }; }
    for (const t of ['itr', 'bdy']) { const a = f[t + 's'] || [];
      for (let i = a.length - 1; i >= 0; i--) { const o = a[i]; if (vis[t] && x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return { type: t, i }; } }
    return null;
  }
  function apply() { if (!f || !rg || !ed) return; const t = frameToString(f); ed.replaceRange(rg.s, rg.e, t); rg.e = rg.s + t.length; }
  function load() {
    const t = ed.value, s = t.lastIndexOf('<frame>', ed.offset); let e = s < 0 ? -1 : t.indexOf('<frame_end>', s);
    f = null; rg = null;
    if (s >= 0 && e >= 0) { e += 11; try { f = readFrame(t.slice(s, e)); } catch { f = null; } if (f) rg = { s, e }; }
    $('#dIdx').value = f ? f.index : ''; $('#dCap').value = f ? f.caption : '';
    if (sel && !selObj()) sel = null; form(); draw();
  }
  const wp = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width / S, (e.clientY - r.top) * cv.height / r.height / S]; };
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => {
    if (!f) return; const [x, y] = wp(e); sel = hit(x, y); form(); draw(); const o = selObj();
    if (o && o.x != null) { drag = { x, y, ox: o.x, oy: o.y }; cv.setPointerCapture(e.pointerId); }
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return; const o = selObj(), [x, y] = wp(e);
    o.x = drag.ox + Math.round(x - drag.x); o.y = drag.oy + Math.round(y - drag.y); form(); draw();
  });
  cv.addEventListener('pointerup', () => { if (drag) { drag = null; apply(); } });
  $('#dForm').addEventListener('change', e => {
    const i = e.target, o = selObj(); if (!i.dataset.k || !o) return;
    if (i.value === '') delete o[i.dataset.k]; else { const n = parseInt(i.value, 10); o[i.dataset.k] = i.dataset.t === 'b' ? n !== 0 : n; }
    apply(); draw();
  });
  el.addEventListener('change', e => { if (e.target.dataset.v) { vis[e.target.dataset.v] = e.target.checked; draw(); } });
  el.addEventListener('click', e => {
    const a = e.target.dataset && e.target.dataset.a; if (!a || !f) return;
    if (a === 'pull') return load();
    if (a === 'itr' || a === 'bdy') { const arr = f[a + 's'] ??= []; arr.push({ ...NEW[a] }); sel = { type: a, i: arr.length - 1 }; }
    else if (a === 'del' && sel) {
      if (sel.type === 'itr' || sel.type === 'bdy') { const k = sel.type + 's'; f[k].splice(sel.i, 1); if (!f[k].length) f[k] = null; } else delete f[sel.type];
      sel = null;
    }
    apply(); form(); draw();
  });
  $('#dIdx').addEventListener('change', e => {
    if (!ed) return; const m = new RegExp('<frame>\\s+' + parseInt(e.target.value, 10) + '\\s').exec(ed.value); if (m) ed.goto(m.index + 8);
  });
  $('#dCap').addEventListener('change', e => { if (f) { f.caption = e.target.value.trim().replace(/\s+/g, '_') || 'frame'; apply(); } });
  return { follow(e) { ed = e; clearTimeout(tm); tm = setTimeout(() => { if (!el.clientWidth) return; if (ed) load(); else { f = null; form(); draw(); } }, 120); } };
}
