// Shared by server pages and client components (no fs here).
export const TAFSIR_BOOKS = ["muyassar", "jalalayn", "ibn-katheer", "qurtubi"] as const;
export type TafsirBook = (typeof TAFSIR_BOOKS)[number];
export const DEFAULT_BOOK: TafsirBook = "muyassar";
export const BOOK_KEY = "yusr.tafseer.book";

export const isTafsirBook = (s: unknown): s is TafsirBook =>
  typeof s === "string" && (TAFSIR_BOOKS as readonly string[]).includes(s);

/** Surah page URL for a book; Muyassar lives at the plain surah route. */
export const tafseerHref = (surah: number, book: TafsirBook) =>
  book === DEFAULT_BOOK ? `/tafseer/${surah}` : `/tafseer/${surah}/${book}`;

export function readSavedBook(): TafsirBook {
  try {
    const v = JSON.parse(localStorage.getItem(BOOK_KEY) ?? "null");
    return isTafsirBook(v) ? v : DEFAULT_BOOK;
  } catch {
    return DEFAULT_BOOK;
  }
}

export function saveBook(book: TafsirBook) {
  try {
    localStorage.setItem(BOOK_KEY, JSON.stringify(book));
  } catch {}
}
