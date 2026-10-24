// Pengganti SolutionExplorer: tree file dari folder yang dipilih
export function createExplorer(el, onOpen) {
  let entries = [];
  const open = new Set(), esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function build() {
    const root = {}; 
    for (const e of entries) { let n = root; const p = e.path.split('/'); p.forEach((s, i) => { n = n[s] ??= i === p.length - 1 ? e : {}; }); }
    el.innerHTML = ''; (function walk(n, d, base) {
      Object.keys(n).sort((a, b) => (!!n[b].path - !!n[a].path) || a.localeCompare(b)).forEach(k => {
        const v = n[k], isFile = !!v.path && !!v.file, row = document.createElement('div');
        row.className = 'row' + (isFile ? '' : ' dir'); row.style.paddingLeft = 10 + d * 14 + 'px';
        row.innerHTML = (isFile ? '📄 ' : open.has(base + k) ? '📂 ' : '📁 ') + esc(k);
        el.appendChild(row);
        if (isFile) row.onclick = () => { el.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); row.classList.add('sel'); onOpen(v); };
        else { row.onclick = () => { open.has(base + k) ? open.delete(base + k) : open.add(base + k); build(); }; if (open.has(base + k)) walk(v, d + 1, base + k + '/'); }
      });
    })(root, 0, '');
  }
  return { set(list) { entries = list; open.clear(); const t = new Set(list.map(e => e.path.split('/')[0])); if (t.size === 1 && list[0].path.includes('/')) open.add([...t][0]); build(); } };
}
