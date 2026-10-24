// Port dari LF2DataUtils.GetFrames / TokenizeFrame
export class DataSyntaxError extends Error {}

/** Ambil semua blok <frame> ... <frame_end> dari teks .dat
 *  (versi asli C# punya bug Substring(i, j+11); di sini dibenarkan) */
export function getFrames(dat) {
  const frames = [];
  for (let i = dat.indexOf('<frame>'); i >= 0; i = dat.indexOf('<frame>', i + 7)) {
    const j = dat.indexOf('<frame_end>', i + 7);
    if (j < 0) return frames;
    frames.push(dat.substring(i, j + 11));
  }
  return frames;
}

const DELIM = ' \t\r\n', DELIM_END = '>:', DELIM_BEGIN = '<';

export function tokenizeFrame(frame) {
  const tokens = [];
  let inToken = false, start = 0;
  for (let i = 0; i < frame.length; i++) {
    const c = frame[i];
    if (DELIM_BEGIN.includes(c)) {
      if (inToken) tokens.push(frame.substring(start, i));
      start = i; inToken = true;
    } else if (DELIM_END.includes(c)) {
      if (!inToken) throw new DataSyntaxError('Syntax Error: Encountered token ending delimeter');
      tokens.push(frame.substring(start, i + 1)); inToken = false;
    } else if (DELIM.includes(c)) {
      if (inToken) { tokens.push(frame.substring(start, i)); inToken = false; }
    } else if (!inToken) { start = i; inToken = true; }
  }
  return tokens;
}
