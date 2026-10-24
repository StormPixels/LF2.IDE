// Akses file. Versi web/WebView: <input type=file> + unduh. Nanti diganti plugin Capacitor Filesystem/SAF.
const pick = (opts) => new Promise(res => {
  const i = document.createElement('input'); i.type = 'file';
  Object.assign(i, opts); i.onchange = () => res([...i.files]); i.oncancel = () => res([]); i.click();
});
export const pickFolder = async () => (await pick({ multiple: true, webkitdirectory: true }))
  .map(f => ({ path: f.webkitRelativePath || f.name, file: f }));
export const pickFiles = async () => (await pick({ multiple: true })).map(f => ({ path: f.name, file: f }));
export const pickImages = async () => (await pick({ multiple: true, accept: 'image/*,.bmp' }));
export const readBytes = async (file) => new Uint8Array(await file.arrayBuffer());
const cap = () => window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins.Filesystem : null;
const b64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); return btoa(s); };
/** Native (APK): simpan ke Documents/LF2IDE/<nama>. Web: unduh biasa. Mengembalikan lokasi simpan. */
export async function saveBytes(name, bytes) {
  const fs = cap();
  if (fs) {
    const path = 'LF2IDE/' + name;
    await fs.writeFile({ path, data: b64(bytes), directory: 'DOCUMENTS', recursive: true });
    return 'Documents/' + path;
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes]));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  return 'Unduhan: ' + name;
}
