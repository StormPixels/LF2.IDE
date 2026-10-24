// Port dari kelas Frame, Itr, Bdy, Opoint, Cpoint, Wpoint, Bpoint.
// Skema = urutan field persis seperti ToString() di C#. 'i' = int, 'b' = bool (0/1).
export const SCHEMA = {
  opoint: { fields: [['kind','i'],['x','i'],['y','i'],['action','i'],['dvx','i'],['dvy','i'],['oid','i'],['facing','i']] },
  bpoint: { fields: [['x','i'],['y','i']] },
  cpoint: { fields: [['kind','i'],['x','i'],['y','i'],['injury','i'],['fronthurtact','i'],['cover','i'],['backhurtact','i'],
    ['vaction','i'],['aaction','i'],['jaction','i'],['daction','i'],['throwvx','i'],['throwvy','i'],['hurtable','b'],
    ['decrease','i'],['dircontrol','b'],['taction','i'],['throwinjury','i'],['throwvz','i']] },
  wpoint: { fields: [['kind','i'],['x','i'],['y','i'],['weaponact','i'],['attacking','i'],['cover','b'],['dvx','i'],['dvy','i'],['dvz','i']] },
  bdy: { fields: [['kind','i'],['x','i'],['y','i'],['w','i'],['h','i']] },
  itr: { fields: [['kind','i'],['x','i'],['y','i'],['w','i'],['h','i'],['dvx','i'],['dvy','i'],['fall','i'],['arest','i'],
      ['vrest','i'],['effect','i'],['bdefend','i'],['injury','i'],['zwidth','i']],
    pairs: [['catchingact','catchingact1','catchingact2'],['caughtact','caughtact1','caughtact2']] },
};
export const FRAME_FIELDS = ['pic','state','wait','next','dvx','dvy','dvz','centerx','centery','mp',
  'hit_a','hit_d','hit_j','hit_Fa','hit_Ua','hit_Da','hit_Fj','hit_Uj','hit_Dj','hit_ja'];

const has = v => v !== undefined && v !== null;
const fmt = (v, t) => (t === 'b' ? (v ? '1' : '0') : String(v));

export function sectionToString(name, o) {
  const s = SCHEMA[name];
  const a = s.fields.filter(([k]) => has(o[k])).map(([k, t]) => `${k}: ${fmt(o[k], t)}`);
  let body = a.join('  ');
  if (s.pairs) {
    const b = s.pairs.filter(([, p, q]) => has(o[p]) && has(o[q])).map(([k, p, q]) => `${k}: ${o[p]} ${o[q]}`);
    if (b.length) body += '  \n      ' + b.join('  ');
  }
  return `   ${name}:\n      ${body}\n   ${name}_end:`;
}

export function frameToString(f) {
  let s = `<frame> ${f.index} ${f.caption}\n   `;
  s += FRAME_FIELDS.filter(k => has(f[k])).map(k => `${k}: ${f[k]}`).join('  ');
  if (has(f.sound)) s += `\n   sound: ${f.sound}`;
  for (const n of ['bpoint','opoint','cpoint','wpoint']) if (f[n]) s += '\n' + sectionToString(n, f[n]);
  for (const i of f.itrs || []) s += '\n' + sectionToString('itr', i);
  for (const b of f.bdys || []) s += '\n' + sectionToString('bdy', b);
  return s + '\n<frame_end>';
}
