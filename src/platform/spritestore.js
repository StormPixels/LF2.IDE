// Simpan sprite di IndexedDB supaya tidak perlu dimuat ulang tiap membuka aplikasi
const open = () => new Promise((res, rej) => {
  const r = indexedDB.open('lf2ide', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('sprites');
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
export async function putSprite(name, blob) {
  const db = await open();
  return new Promise((res, rej) => { const t = db.transaction('sprites', 'readwrite'); t.objectStore('sprites').put(blob, name); t.oncomplete = res; t.onerror = () => rej(t.error); });
}
export async function allSprites() {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction('sprites'), s = t.objectStore('sprites'), k = s.getAllKeys(), v = s.getAll();
    t.oncomplete = () => res(k.result.map((n, i) => [n, v.result[i]])); t.onerror = () => rej(t.error);
  });
}
