/** Folds Arabic letter variants and strips harakat so "اذاعه" matches "إذاعة". */
export const normalizeSearch = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ٰٟـۖ-ۭ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[-_'\s]+/g, " ")
    .trim();
