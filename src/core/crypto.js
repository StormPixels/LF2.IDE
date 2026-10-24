// Port dari UnsafeLF2DataAlgorithm.cs / LF2DataUtils.Encrypt+Decrypt
export const DEFAULT_KEY = 'odBearBecauseHeIsVeryGoodSiuHungIsAGo';
const HEADER = 123;

function bytesToAscii(b) {
  let s = '';
  for (let i = 0; i < b.length; i += 8192)
    s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
  return s;
}

/** bytes: Uint8Array isi file .dat -> string teks */
export function decrypt(bytes, key = DEFAULT_KEY) {
  if (!key) return bytesToAscii(bytes);
  const out = new Uint8Array(Math.max(0, bytes.length - HEADER));
  for (let i = 0, k = key.length; i < out.length; i++)
    out[i] = (bytes[HEADER + i] - key.charCodeAt(i % k)) & 255;
  return bytesToAscii(out);
}

/** text -> Uint8Array siap ditulis ke file .dat */
export function encrypt(text, key = DEFAULT_KEY) {
  const out = new Uint8Array(HEADER + text.length); // 123 byte pertama = 0
  for (let i = 0, k = key ? key.length : 0; i < text.length; i++)
    out[HEADER + i] = (text.charCodeAt(i) + (k ? key.charCodeAt(i % k) : 0)) & 255;
  return out;
}
