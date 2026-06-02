// speechify.js — turn on-screen text into TTS-friendly speech text.
//
// The click-to-read layer can be handed ANY visible string (a goal sentence, a
// caption, a bare "5/7", a heading). Neural voices read WORDS far more reliably
// than glyphs, so before we synthesize arbitrary text we:
//   • spell fractions:   "5/7" → "five sevenths",  "1/2" → "one half"
//   • read symbols:      "№1" → "number 1"
//   • drop UI glyphs:    ★ ▸ ← ↺ ⟲ ✎ ✓ · • | (icons, not words)
//   • collapse runs of whitespace
// The normalized string is ALSO the server's cache key, so the same visible text
// always maps to one baked clip (and the spoken words match what was cached).

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

export function numberToWords(n) {
  n = Math.trunc(n);
  if (n < 0) return "minus " + numberToWords(-n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  if (n < 1000) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + numberToWords(n % 100) : "");
  return String(n); // big numbers are vanishingly rare here — leave as digits
}

// denominator → [singular, plural] fraction word (matches voiceLines house style)
const DENOM = {
  2: ["half", "halves"], 3: ["third", "thirds"], 4: ["quarter", "quarters"],
  5: ["fifth", "fifths"], 6: ["sixth", "sixths"], 7: ["seventh", "sevenths"],
  8: ["eighth", "eighths"], 9: ["ninth", "ninths"], 10: ["tenth", "tenths"],
  11: ["eleventh", "elevenths"], 12: ["twelfth", "twelfths"],
};

function fractionToWords(numStr, denStr) {
  const num = parseInt(numStr, 10), den = parseInt(denStr, 10);
  if (!(num >= 0) || !(den > 1)) return null;
  const d = DENOM[den];
  const denWord = d ? d[num === 1 ? 0 : 1] : numberToWords(den) + (num === 1 ? "th" : "ths");
  return numberToWords(num) + " " + denWord;
}

export function speechify(raw) {
  if (raw == null) return "";
  let t = String(raw);
  // fractions like 2/7 → "two sevenths" (guard against dates / paths via the
  // surrounding-character checks; no lookbehind, for older Safari).
  t = t.replace(/(^|[^\w/])(\d{1,3})\s*\/\s*(\d{1,3})(?![\w/])/g, (m, pre, a, b) => {
    const w = fractionToWords(a, b);
    return w ? pre + w : m;
  });
  t = t.replace(/№\s*/g, "number ");
  // strip UI/control glyphs (arrows, stars, pencils, checks, bullets, pipes)
  t = t.replace(/[★☆▸◂▶◀▲▼←→↑↓↺↻⟲⟳✎✏✓✔✗✘·•|–—]/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}
