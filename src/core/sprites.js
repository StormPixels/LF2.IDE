// Port dari SpriteSheet.cs + pemotongan sprite di FormDesign.ParseBmpList
export const SHEET_RE = /file\((\d*)-(\d*)\): *(.*?) *w: *(\d*) *h: *(\d*) *row: *(\d*) *col: *(\d*)/g;
const base = p => p.trim().split(/[\\/]/).pop().toLowerCase();

export function parseSheets(head) {
  return [...head.matchAll(SHEET_RE)].map(m => ({ start: +m[1], end: +m[2], file: m[3].trim(), name: base(m[3]), w: +m[4], h: +m[5], row: +m[6], col: +m[7] }));
}
/** Posisi sprite `pic` di dalam sheet: kotak (sx, sy, w, h) */
export function cellFor(sheets, pic) {
  const s = sheets.find(x => pic >= x.start && pic <= x.end); if (!s || !s.col) return null;
  const i = pic - s.start;
  return { s, sx: (i % s.col) * (s.w + 1), sy: Math.floor(i / s.col) * (s.h + 1) };
}
