// Khatma plan math on the 604-page Madinah mushaf.

export const TOTAL_PAGES = 604;
export const PLANS_KEY = "yusr.khatma.plans";

/** Stored shape (read by the achievements feature too). */
export type KhatmaPlan = {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  days: number;
  startPage: number;
  completedDays: string[]; // YYYY-MM-DD
  currentPage: number; // last page read; startPage - 1 before the first wird
};

export type Wird = { n: number; from: number; to: number };

export const JUZ_START = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 201, 221, 241, 261, 281, 301, 321, 341, 361, 381, 401, 421, 441,
  461, 481, 501, 521, 541, 561, 582,
];

export const HIZB_START = [
  1, 12, 22, 32, 42, 52, 62, 72, 82, 92, 102, 112, 122, 132, 142, 152, 162, 172, 182, 192, 201, 211, 221, 231,
  241, 251, 261, 271, 281, 291, 301, 311, 321, 331, 341, 351, 361, 371, 381, 391, 401, 411, 421, 431, 441, 451,
  461, 471, 481, 491, 501, 511, 521, 531, 541, 551, 561, 571, 582, 592,
];

const lastIndexAtOrBefore = (starts: number[], page: number) => {
  let i = 0;
  while (i + 1 < starts.length && starts[i + 1] <= page) i++;
  return i;
};

export const juzOf = (page: number) => lastIndexAtOrBefore(JUZ_START, page) + 1;
export const hizbOf = (page: number) => lastIndexAtOrBefore(HIZB_START, page) + 1;

/**
 * Splits the pages from `startPage` to 604 into `days` portions. When the plan
 * starts on a hizb and the remaining hizbs divide evenly by the days (e.g. 30
 * days = a juz a day, 60 = a hizb a day), portions follow hizb boundaries;
 * otherwise pages are split as evenly as possible.
 */
export function buildSchedule(startPage: number, days: number): { wirds: Wird[]; hizbsPerDay?: number } {
  const hizbIndex = HIZB_START.indexOf(startPage);
  if (hizbIndex >= 0) {
    const hizbs = HIZB_START.length - hizbIndex;
    if (hizbs % days === 0) {
      const k = hizbs / days;
      const wirds = Array.from({ length: days }, (_, i) => {
        const a = hizbIndex + i * k;
        const b = a + k;
        return { n: i + 1, from: HIZB_START[a], to: b < HIZB_START.length ? HIZB_START[b] - 1 : TOTAL_PAGES };
      });
      return { wirds, hizbsPerDay: k };
    }
  }
  const total = TOTAL_PAGES - startPage + 1;
  const d = Math.min(days, total);
  const wirds = Array.from({ length: d }, (_, i) => ({
    n: i + 1,
    from: startPage + Math.floor((i * total) / d),
    to: startPage + Math.floor(((i + 1) * total) / d) - 1,
  }));
  return { wirds };
}

export const isComplete = (p: KhatmaPlan) => p.currentPage >= TOTAL_PAGES;

/** The portion holding the next unread page. */
export function currentWird(p: KhatmaPlan, wirds: Wird[]) {
  const next = Math.max(p.currentPage + 1, p.startPage);
  return wirds.find((w) => w.to >= next) ?? wirds[wirds.length - 1];
}

export function progress(p: KhatmaPlan) {
  const total = TOTAL_PAGES - p.startPage + 1;
  return Math.min(1, Math.max(0, (p.currentPage - p.startPage + 1) / total));
}

export const ymd = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Days since the start date, 1-based (today = day 1 on the start date). */
export function dayNumber(p: KhatmaPlan, today = ymd()) {
  const ms = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${p.startDate}T00:00:00Z`);
  return Math.floor(ms / 86_400_000) + 1;
}

/** Consecutive completed days ending today or yesterday. */
export function streak(p: KhatmaPlan, today = new Date()) {
  const done = new Set(p.completedDays);
  const d = new Date(today);
  if (!done.has(ymd(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (done.has(ymd(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
