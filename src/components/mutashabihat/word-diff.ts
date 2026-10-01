// Word-level diff of two Quranic texts (port of the app's arabic_word_diff.dart).
// Words are compared on a normalized skeleton while the original words are shown.

const IGNORED = /[ؐ-ًؚ-ٖٓ-ٟۖ-ۭ࣓-ࣿـ‌‍⁠]/g;
const MAQSURA_DAGGER = /ى[ً-ٟۖ-ۭ]*ٰ/g;
const LETTER_FORMS: Record<string, string> = {
  "ٱ": "ا",
  "ٰ": "ا",
  "آ": "ءا",
  "أ": "ء",
  "إ": "ء",
  "ؤ": "ء",
  "ئ": "ء",
  "ٔ": "ء",
  "ٕ": "ء",
  "ى": "ي",
  "ة": "ه",
};
const LETTER_FORM_RE = new RegExp(`[${Object.keys(LETTER_FORMS).join("")}]`, "g");

export const normalizeWord = (w: string) =>
  w.replace(MAQSURA_DAGGER, "ى").replace(LETTER_FORM_RE, (m) => LETTER_FORMS[m]).replace(IGNORED, "").trim();

export const splitWords = (text: string) => text.trim().split(/\s+/).filter(Boolean);

/** For each word of `a` and `b`, whether it lies outside their longest common subsequence. */
export function diffWords(a: string[], b: string[]) {
  const diffA = a.map(() => false);
  const diffB = b.map(() => false);
  const idxA: number[] = [];
  const idxB: number[] = [];
  const normA: string[] = [];
  const normB: string[] = [];
  a.forEach((w, i) => {
    const n = normalizeWord(w);
    if (!n) return;
    idxA.push(i);
    normA.push(n);
  });
  b.forEach((w, j) => {
    const n = normalizeWord(w);
    if (!n) return;
    idxB.push(j);
    normB.push(n);
  });
  const n = normA.length;
  const m = normB.length;
  const width = m + 1;
  const lcs = new Uint16Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      lcs[i * width + j] =
        normA[i] === normB[j] ? lcs[(i + 1) * width + j + 1] + 1 : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (normA[i] === normB[j]) {
      i++;
      j++;
    } else if (lcs[(i + 1) * width + j] >= lcs[i * width + j + 1]) diffA[idxA[i++]] = true;
    else diffB[idxB[j++]] = true;
  }
  while (i < n) diffA[idxA[i++]] = true;
  while (j < m) diffB[idxB[j++]] = true;
  return { a: diffA, b: diffB };
}
