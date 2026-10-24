// Pengganti MainForm + docking.xml: panel kiri jadi drawer di layar sempit
export function initLayout({ onToggle } = {}) {
  const b = document.body, set = on => { b.classList.toggle('exp', on); onToggle?.(on); };
  document.getElementById('btnExplorer').onclick = () => {
    if (matchMedia('(max-width:800px)').matches) set(!b.classList.contains('exp'));
    else { const e = document.getElementById('explorer'); e.style.display = e.style.display === 'none' ? '' : 'none'; }
  };
  document.getElementById('scrim').onclick = () => set(false);
  return { closeDrawer: () => set(false) };
}
