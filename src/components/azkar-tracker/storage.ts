// Azkar tracker storage, shared with /azkar/[id] (auto-marks a category done)
// and other features (achievements reads the log).

/** `yusr.azkar-tracker.log`: { "YYYY-MM-DD": { [categoryId]: true } } — true = read that day. */
export type AzkarLog = Record<string, Record<string, boolean>>;
export const AZKAR_LOG_KEY = "yusr.azkar-tracker.log";

/** Tracked categories → their id in data/azkar.json (getAzkar()). */
export const TRACKED = [
  { id: "morning", azkarId: 1 },
  { id: "evening", azkarId: 2 },
  { id: "after-prayer", azkarId: 3 },
  { id: "sleep", azkarId: 5 },
  { id: "waking", azkarId: 6 },
] as const;
export type TrackedId = (typeof TRACKED)[number]["id"];

/** Like the app, a day is complete when both the morning and evening azkar are read. */
export const CORE: TrackedId[] = ["morning", "evening"];
export const isCompleteDay = (day?: Record<string, boolean>) => CORE.every((c) => day?.[c]);

export const trackedIdFor = (azkarId: number) => TRACKED.find((t) => t.azkarId === azkarId)?.id;

/** Marks `categoryId` as read today (called when every item of a category is finished). */
export function markAzkarRead(categoryId: string, date = new Date()) {
  try {
    const p = (n: number) => String(n).padStart(2, "0");
    const key = `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
    const log: AzkarLog = JSON.parse(localStorage.getItem(AZKAR_LOG_KEY) ?? "{}");
    if (log[key]?.[categoryId]) return;
    log[key] = { ...log[key], [categoryId]: true };
    localStorage.setItem(AZKAR_LOG_KEY, JSON.stringify(log));
  } catch {}
}
