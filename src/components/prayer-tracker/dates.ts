// Local-calendar date helpers shared by the trackers (prayer, azkar, qiyam).

/** `YYYY-MM-DD` of the local calendar day (the storage key format). */
export function dayKey(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseDay(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Calendar-day arithmetic (DST-safe, like Dart's DateTime(y, m, d + n)). */
export function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Consecutive days satisfying `ok`, ending today — or yesterday, since today may still be in progress. */
export function currentStreak(ok: (key: string) => boolean, today = new Date()) {
  const run = (from: Date) => {
    let n = 0;
    for (let d = from; ok(dayKey(d)); d = addDays(d, -1)) n++;
    return n;
  };
  return run(today) || run(addDays(today, -1));
}

/** Longest run of consecutive day keys in `keys`. */
export function bestStreak(keys: Iterable<string>) {
  const set = new Set(keys);
  let best = 0;
  for (const k of set) {
    if (set.has(dayKey(addDays(parseDay(k), -1)))) continue;
    let run = 0;
    for (let d = parseDay(k); set.has(dayKey(d)); d = addDays(d, 1)) run++;
    best = Math.max(best, run);
  }
  return best;
}

const intlLocale = (locale: string) => (locale === "ar" ? "ar-EG" : "en-US");

export const fmtDate = (d: Date, locale: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(intlLocale(locale), opts).format(d);

export const fmtHijri = (d: Date, locale: string) =>
  new Intl.DateTimeFormat(`${intlLocale(locale)}-u-ca-islamic-umalqura`, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);

/** Weekday initials starting on Saturday (the app's week view). */
export const weekdayShort = (d: Date, locale: string) => fmtDate(d, locale, { weekday: "short" });
