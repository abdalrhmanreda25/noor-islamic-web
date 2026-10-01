// Umm al-Qura Hijri helpers on top of Intl (same calendar as the app's jhijri,
// 0-day adjustment). Dates are plain "YYYY-MM-DD" day keys or Dates at UTC
// noon, so the math never crosses a DST or timezone edge.

export type HijriYmd = { year: number; month: number; day: number };

const DAY = 86_400_000;

const fmt = (() => {
  let f: Intl.DateTimeFormat | null = null;
  return () =>
    (f ??= new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }));
})();

export const HIJRI_MONTHS = {
  ar: ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"],
  en: ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Akhir", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qa'dah", "Dhu al-Hijjah"],
} as const;

export const hijriMonthName = (month: number, locale: string) =>
  HIJRI_MONTHS[locale === "ar" ? "ar" : "en"][month - 1];

/** "YYYY-MM-DD" of a local Date. */
export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** A day key as a Date at UTC noon. */
export function keyToDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function utcKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const addDays = (key: string, n: number) => utcKey(new Date(keyToDate(key).getTime() + n * DAY));

export const daysBetween = (from: string, to: string) =>
  Math.round((keyToDate(to).getTime() - keyToDate(from).getTime()) / DAY);

export const todayKey = () => dayKey(new Date());

export function toHijri(key: string): HijriYmd {
  const parts = fmt().formatToParts(keyToDate(key));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

const hijriIndex = ({ year, month, day }: HijriYmd) => (year * 12 + month - 1) * 30 + day;

/** Gregorian day key on which the Umm al-Qura calendar shows year/month/day. */
export function fromHijri(year: number, month: number, day: number): string {
  // Rough estimate from the mean lunar month, then walk to the exact day.
  const months = (year - 1) * 12 + (month - 1);
  const epoch = Date.UTC(622, 6, 19, 12);
  let key = utcKey(new Date(epoch + (months * 29.530588853 + day - 1) * DAY));
  const target = hijriIndex({ year, month, day });
  for (let i = 0; i < 60; i++) {
    const h = toHijri(key);
    if (h.year === year && h.month === month && h.day === day) return key;
    const diff = target - hijriIndex(h);
    // Day 30 may not exist: stop when we've stepped past it.
    if (day === 30 && h.day === 1 && diff === -1) return addDays(key, -1);
    key = addDays(key, Math.max(-15, Math.min(15, diff)) || 1);
  }
  return key;
}

export function daysInHijriMonth(year: number, month: number) {
  const next = month === 12 ? fromHijri(year + 1, 1, 1) : fromHijri(year, month + 1, 1);
  return daysBetween(fromHijri(year, month, 1), next);
}

/** Next Gregorian date (on/after `from`) for a recurring Hijri month/day. */
export function nextOccurrence(month: number, day: number, from = todayKey()) {
  const h = toHijri(from);
  let key = fromHijri(h.year, month, Math.min(day, daysInHijriMonth(h.year, month)));
  if (key < from) key = fromHijri(h.year + 1, month, Math.min(day, daysInHijriMonth(h.year + 1, month)));
  return key;
}

export function formatHijri(key: string, locale: string) {
  const h = toHijri(key);
  const n = (x: number) => (locale === "ar" ? x.toLocaleString("ar-EG", { useGrouping: false }) : String(x));
  return `${n(h.day)} ${hijriMonthName(h.month, locale)} ${n(h.year)} ${locale === "ar" ? "هـ" : "AH"}`;
}

export function formatGregorian(key: string, locale: string, opts: Intl.DateTimeFormatOptions = { dateStyle: "long" }) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { ...opts, timeZone: "UTC" }).format(keyToDate(key));
}

/** Fixed Islamic occasions (lib/features/hijri_tools/data/hijri_events.dart). */
export const ISLAMIC_EVENTS = [
  { id: "newYear", month: 1, day: 1 },
  { id: "ashura", month: 1, day: 10 },
  { id: "ramadanStart", month: 9, day: 1 },
  { id: "lastTen", month: 9, day: 21 },
  { id: "eidFitr", month: 10, day: 1 },
  { id: "dhulHijjahTen", month: 12, day: 1 },
  { id: "arafah", month: 12, day: 9 },
  { id: "eidAdha", month: 12, day: 10 },
  { id: "tashreeq", month: 12, day: 11 },
] as const;

export function upcomingEvents(from = todayKey()) {
  return ISLAMIC_EVENTS.map((e) => {
    const date = nextOccurrence(e.month, e.day, from);
    return { ...e, date, daysUntil: daysBetween(from, date), hijriYear: toHijri(date).year };
  }).sort((a, b) => a.daysUntil - b.daysUntil);
}

export type Span = { years: number; months: number; days: number };

/** Age in Hijri years/months/days with borrow (HijriService.hijriAge). */
export function hijriAge(birth: string, on = todayKey()): Span {
  const b = toHijri(birth);
  const t = toHijri(on);
  let days = t.day - b.day;
  let months = t.month - b.month;
  let years = t.year - b.year;
  if (days < 0) {
    months -= 1;
    days += t.month === 1 ? daysInHijriMonth(t.year - 1, 12) : daysInHijriMonth(t.year, t.month - 1);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return years < 0 ? { years: 0, months: 0, days: 0 } : { years, months, days };
}

export function gregorianAge(birth: string, on = todayKey()): Span {
  const [by, bm, bd] = birth.split("-").map(Number);
  const [ty, tm, td] = on.split("-").map(Number);
  let days = td - bd;
  let months = tm - bm;
  let years = ty - by;
  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(ty, tm - 1, 0)).getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return years < 0 ? { years: 0, months: 0, days: 0 } : { years, months, days };
}
