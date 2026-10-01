// Port of the Flutter PrayerCalculationService: same region → method mapping,
// Shafi'i Asr and Cairo fallback, so web and app show identical times.
import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
  Qibla,
} from "adhan";

export const DEFAULT_LOCATION = { latitude: 30.0444, longitude: 31.2357 };

export const PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerName = (typeof PRAYERS)[number];

export type MethodName =
  | "Egyptian"
  | "UmmAlQura"
  | "Kuwait"
  | "Qatar"
  | "Dubai"
  | "MuslimWorldLeague";

const inBox = (lat: number, lng: number, [a, b, c, d]: number[]) =>
  lat >= a && lat <= b && lng >= c && lng <= d;

/** Region timezone used by the app; null outside the known regions. */
export function regionTimezone(lat: number, lng: number): string | null {
  // Gulf boxes sit inside the broad Saudi box, so test them first.
  if (inBox(lat, lng, [22, 32, 25, 36])) return "Africa/Cairo";
  if (inBox(lat, lng, [22, 26.5, 51, 57])) return "Asia/Dubai";
  if (inBox(lat, lng, [28.5, 30.5, 46.5, 49])) return "Asia/Kuwait";
  if (inBox(lat, lng, [24.5, 26.5, 50.5, 52])) return "Asia/Qatar";
  if (inBox(lat, lng, [16, 32, 34, 56])) return "Asia/Riyadh";
  return null;
}

const METHOD_BY_TZ: Record<string, MethodName> = {
  "Africa/Cairo": "Egyptian",
  "Asia/Riyadh": "UmmAlQura",
  "Asia/Kuwait": "Kuwait",
  "Asia/Qatar": "Qatar",
  "Asia/Dubai": "Dubai",
};

export const METHODS: MethodName[] = ["Egyptian", "UmmAlQura", "Kuwait", "Qatar", "Dubai", "MuslimWorldLeague"];

/**
 * User prayer settings (Settings page), stored in localStorage as
 * `yusr.settings.prayer`: manual minute corrections per time, as in the app's
 * prayer_time_adjustments_sheet (±60 min), and an optional method override.
 */
export type PrayerSettings = {
  adjustments: Record<PrayerName, number>;
  method?: MethodName | "auto";
};
export const PRAYER_SETTINGS_KEY = "yusr.settings.prayer";
export const MAX_ADJUSTMENT = 60;

/** Saved prayer settings; null on the server or when nothing is saved. */
export function readPrayerSettings(): PrayerSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(localStorage.getItem(PRAYER_SETTINGS_KEY) ?? "null");
    return raw && typeof raw === "object" ? (raw as PrayerSettings) : null;
  } catch {
    return null;
  }
}

export function computePrayerTimes(lat: number, lng: number, date = new Date(), settings = readPrayerSettings()) {
  const regionTz = regionTimezone(lat, lng);
  const override = settings?.method;
  const method: MethodName =
    override && override !== "auto" && METHODS.includes(override)
      ? override
      : (regionTz && METHOD_BY_TZ[regionTz]) || "MuslimWorldLeague";
  const params = CalculationMethod[method]();
  params.madhab = Madhab.Shafi;
  // The user's manual corrections go on top of the method's own adjustments.
  for (const p of PRAYERS) {
    const m = Number(settings?.adjustments?.[p]);
    if (Number.isFinite(m) && m) params.adjustments[p] = Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, Math.round(m)));
  }
  const times = new PrayerTimes(new Coordinates(lat, lng), date, params);
  return {
    method,
    // Outside the mapped regions, fall back to the browser's own timezone.
    timeZone: regionTz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    times: Object.fromEntries(PRAYERS.map((p) => [p, times[p]])) as Record<PrayerName, Date>,
  };
}

/** Next prayer (Sunrise excluded) after `now`, rolling over to tomorrow's Fajr. */
export function nextPrayer(lat: number, lng: number, now = new Date()) {
  const { times } = computePrayerTimes(lat, lng, now);
  for (const p of PRAYERS) {
    if (p !== "sunrise" && times[p] > now) return { name: p, time: times[p] };
  }
  const tomorrow = new Date(now.getTime() + 86_400_000);
  return { name: "fajr" as PrayerName, time: computePrayerTimes(lat, lng, tomorrow).times.fajr };
}

export const qiblaBearing = (lat: number, lng: number) => Qibla(new Coordinates(lat, lng));

const KAABA = { latitude: 21.4225, longitude: 39.8262 };

export function distanceToKaabaKm(lat: number, lng: number) {
  const rad = Math.PI / 180;
  const dLat = (KAABA.latitude - lat) * rad;
  const dLng = (KAABA.longitude - lng) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat * rad) * Math.cos(KAABA.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function formatTime(date: Date, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function formatDuration(ms: number, locale: string) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumIntegerDigits: 2,
  });
  return [h, m, s].map((n) => nf.format(n)).join(":");
}
