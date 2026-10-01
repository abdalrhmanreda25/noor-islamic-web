// Fasting tracker rules (lib/features/fasting_tracker/data/*.dart).
//
// Storage: localStorage "yusr.fasting-tracker.log" = { [YYYY-MM-DD]: FastType }.
// FastType values:
//   "ramadan"          obligatory Ramadan fast (web addition; the app's log skips Ramadan)
//   "missed"           a Ramadan day not fasted: adds one day to the qada counter
//   "qada"             a make-up fast: deducts one day from the qada counter
//   "monday_thursday" | "white_days" | "ashura" | "arafah" | "shawwal_six" | "voluntary"
//                      the app's FastType.dbKey values for voluntary fasts
// Every value except "missed" counts as a fasted day.
// Qada counter: "yusr.fasting-tracker.qada" = number (never negative).
import { addDays, daysBetween, toHijri, type HijriYmd } from "./hijri";

export const LOG_KEY = "yusr.fasting-tracker.log";
export const QADA_KEY = "yusr.fasting-tracker.qada";

export const FAST_TYPES = [
  "ramadan",
  "missed",
  "monday_thursday",
  "white_days",
  "ashura",
  "arafah",
  "shawwal_six",
  "qada",
  "voluntary",
] as const;
export type FastType = (typeof FAST_TYPES)[number];
export type FastLog = Record<string, FastType>;

/** Eid al-Fitr, Eid al-Adha and Tashreeq (isForbiddenFastingDay). */
export const isForbiddenFastingDay = (h: HijriYmd) =>
  (h.month === 10 && h.day === 1) || (h.month === 12 && h.day >= 10 && h.day <= 13);

const weekday = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay(); // 0 = Sunday

/** suggestedFastType: occasion > white days > Monday/Thursday > voluntary. */
export function suggestedFastType(key: string): FastType {
  const h = toHijri(key);
  if (h.month === 9) return "ramadan";
  if (h.month === 1 && (h.day === 9 || h.day === 10)) return "ashura";
  if (h.month === 12 && h.day === 9) return "arafah";
  if (h.month === 10 && h.day >= 2 && h.day <= 7) return "shawwal_six";
  if (h.day >= 13 && h.day <= 15) return "white_days";
  const wd = weekday(key);
  if (wd === 1 || wd === 4) return "monday_thursday";
  return "voluntary";
}

export type Occasion = {
  id: "monday" | "thursday" | "whiteDays" | "ashura" | "arafah";
  type: FastType;
  date: string;
  daysAway: number;
  hijri: HijriYmd;
};

/** computeUpcomingOccasions, sorted soonest first. */
export function upcomingFastingOccasions(today: string): Occasion[] {
  const out: Occasion[] = [];
  const wd = weekday(today);
  for (const [target, id] of [
    [1, "monday"],
    [4, "thursday"],
  ] as const) {
    const diff = (target - wd + 7) % 7;
    const date = addDays(today, diff);
    out.push({ id, type: "monday_thursday", date, daysAway: diff, hijri: toHijri(date) });
  }
  for (let i = 0; i <= 65; i++) {
    const d = addDays(today, i);
    const h = toHijri(d);
    if (h.month === 9 || h.day < 13 || h.day > 15 || isForbiddenFastingDay(h)) continue;
    out.push({ id: "whiteDays", type: "white_days", date: d, daysAway: i, hijri: h });
    break;
  }
  let ashura = false;
  let arafah = false;
  for (let i = 0; i <= 400 && !(ashura && arafah); i++) {
    const d = addDays(today, i);
    const h = toHijri(d);
    if (!ashura && h.month === 1 && h.day === 10) {
      ashura = true;
      out.push({ id: "ashura", type: "ashura", date: d, daysAway: daysBetween(today, d), hijri: h });
    }
    if (!arafah && h.month === 12 && h.day === 9) {
      arafah = true;
      out.push({ id: "arafah", type: "arafah", date: d, daysAway: daysBetween(today, d), hijri: h });
    }
  }
  return out.sort((a, b) => a.daysAway - b.daysAway);
}
