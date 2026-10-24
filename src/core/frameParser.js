// Port dari LF2DataUtils.ReadFrame (state machine, dibuat berbasis skema)
import { tokenizeFrame } from './tokenizer.js';
import { SCHEMA, FRAME_FIELDS } from './models.js';

const int = t => { const n = parseInt(t, 10); if (Number.isNaN(n)) throw new Error('Angka tidak valid: ' + t); return n; };

export function readFrame(input) {
  const t = typeof input === 'string' ? tokenizeFrame(input) : input;
  if (!(t.length > 2 && t[0] === '<frame>' && t[t.length - 1] === '<frame_end>')) return null;
  const f = { index: int(t[1]), caption: t[2], bdys: null, itrs: null };
  const bdys = [], itrs = [];
  let cur = null, curName = null; // seksi yang sedang dibaca
  const top = new Set(FRAME_FIELDS.map(k => k + ':'));
  for (let i = 3; i < t.length; i++) {
    const tok = t[i];
    if (!cur) {
      if (top.has(tok)) f[tok.slice(0, -1)] = int(t[++i]);
      else if (tok === 'sound:') f.sound = t[++i];
      else if (tok.endsWith(':') && SCHEMA[tok.slice(0, -1)]) {
        curName = tok.slice(0, -1); cur = {};
        if (curName === 'bdy') bdys.push(cur); else if (curName === 'itr') itrs.push(cur); else f[curName] = cur;
      }
    } else if (tok === curName + '_end:') { cur = null; }
    else {
      const key = tok.slice(0, -1), s = SCHEMA[curName];
      const fld = s.fields.find(([k]) => k === key);
      const pair = s.pairs && s.pairs.find(([k]) => k === key);
      if (fld) cur[key] = fld[1] === 'b' ? int(t[++i]) !== 0 : int(t[++i]);
      else if (pair) { cur[pair[1]] = int(t[++i]); cur[pair[2]] = int(t[++i]); }
    }
  }
  f.bdys = bdys.length ? bdys : null;
  f.itrs = itrs.length ? itrs : null;
  return f;
}
