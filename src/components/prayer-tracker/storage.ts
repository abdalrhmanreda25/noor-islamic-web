// Prayer tracker storage, shared with other features (achievements reads the log).

export const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

/**
 * Status of one logged prayer (the Flutter app's PrayerStatus, minus `none`,
 * which is simply a missing entry):
 * - "jamaah": prayed on time in congregation (جماعة)
 * - "alone":  prayed on time, alone (منفرد)
 * - "qada":   made up later (قضاء)
 * - "missed": not prayed (فائتة)
 * "jamaah", "alone" and "qada" count as prayed for streaks and completion.
 */
export type State = "jamaah" | "alone" | "qada" | "missed";
export const STATES: State[] = ["jamaah", "alone", "qada", "missed"];
export const countsAsPrayed = (s?: State) => s === "jamaah" || s === "alone" || s === "qada";

/** `yusr.prayer-tracker.log`: { "YYYY-MM-DD": { fajr?: State, dhuhr?: State, ... } } */
export type PrayerLog = Record<string, Partial<Record<PrayerKey, State>>>;
export const PRAYER_LOG_KEY = "yusr.prayer-tracker.log";

/** `yusr.prayer-tracker.qada`: outstanding make-up prayers per prayer. */
export type QadaCounts = Partial<Record<PrayerKey, number>>;
export const QADA_KEY = "yusr.prayer-tracker.qada";

export const prayedCount = (day?: PrayerLog[string]) =>
  day ? PRAYER_KEYS.filter((p) => countsAsPrayed(day[p])).length : 0;

/** A day with all five prayers logged as prayed. */
export const isFullDay = (day?: PrayerLog[string]) => prayedCount(day) === PRAYER_KEYS.length;

/** Theme-token colors per status (app: green / gold / orange / red). */
export const STATE_STYLE: Record<State, { bg: string; text: string; hover: string }> = {
  jamaah: { bg: "bg-brand", text: "text-brand", hover: "hover:bg-brand/15" },
  alone: { bg: "bg-gold", text: "text-gold", hover: "hover:bg-gold/20" },
  qada: { bg: "bg-chart-3", text: "text-chart-3", hover: "hover:bg-chart-3/15" },
  missed: { bg: "bg-destructive", text: "text-destructive", hover: "hover:bg-destructive/15" },
};
