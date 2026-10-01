// Achievements: badges, points and levels (lib/features/achievements), computed
// client-side from what the other features store in localStorage.
//
// Read (all optional, missing or malformed keys count as zero):
//   yusr.prayer-tracker.log   { [day]: { fajr?, dhuhr?, asr?, maghrib?, isha? } }  any truthy value except "missed" = prayed
//   yusr.azkar-tracker.log    { [day]: { [categoryId]: boolean } }                 full day = morning + evening
//   yusr.fasting-tracker.log  { [day]: FastType }                                  every value except "missed" = fasted
//   yusr.khatma.plans         [{ currentPage, ... }]
//   yusr.quran.lastPage       number
//   yusr.tasbeeh              total count (number as string)
//   yusr.night-prayer.log     { [day]: rak'ahs }
//   yusr.sunan.<day>          string[] of sunnah ids
//   yusr.quiz.stats           { correct, ... }
// Owned here:
//   yusr.achievements.badges  { [badgeId]: "YYYY-MM-DD" unlock date }
//   yusr.achievements.journal JournalEntry[]
import { addDays, daysBetween } from "./hijri";

export const BADGES_KEY = "yusr.achievements.badges";
export const JOURNAL_KEY = "yusr.achievements.journal";

export const METRICS = [
  "prayerFullDays",
  "prayerBestStreak",
  "fajrJamaah",
  "quranPages",
  "khatmas",
  "azkarFullDays",
  "azkarBestStreak",
  "tasbeehTotal",
  "fastDays",
  "whiteDays",
  "qiyamNights",
  "rawatibFullDays",
  "witrDays",
  "nawawiMemorized",
  "namesMemorized",
  "quizCorrect",
  "journalEntries",
] as const;
export type Metric = (typeof METRICS)[number];

export const TIERS = { bronze: 10, silver: 25, gold: 50 } as const;
export type Tier = keyof typeof TIERS;
export const CATEGORIES = ["prayer", "quran", "dhikr", "fasting", "nawafil", "knowledge", "journal"] as const;
export type BadgeCategory = (typeof CATEGORIES)[number];

type L = { ar: string; en: string };
export type BadgeDef = { id: string; category: BadgeCategory; tier: Tier; metric: Metric; target: number; title: L; description: L; unit: L };

const ladder = (
  id: string,
  category: BadgeCategory,
  metric: Metric,
  unit: L,
  tiers: [Tier, number, L, L][],
): BadgeDef[] => tiers.map(([tier, target, title, description]) => ({ id: `${id}_${tier}`, category, tier, metric, target, title, description, unit }));

const DAY = { ar: "يوم", en: "days" };
const ROW = { ar: "يوم متتالٍ", en: "days in a row" };
const NIGHT = { ar: "ليلة", en: "nights" };

/** kBadges, in catalog order. */
export const BADGES: BadgeDef[] = [
  ...ladder("prayer_days", "prayer", "prayerFullDays", DAY, [
    ["bronze", 7, { ar: "محافظ على الصلاة", en: "Keeper of prayer" }, { ar: "سجّل الصلوات الخمس كاملة في متتبع الصلاة 7 أيام", en: "Log all five prayers in the prayer tracker on 7 days" }],
    ["silver", 30, { ar: "مقيم الصلاة", en: "Establisher of prayer" }, { ar: "سجّل الصلوات الخمس كاملة في متتبع الصلاة 30 يومًا", en: "Log all five prayers in the prayer tracker on 30 days" }],
    ["gold", 100, { ar: "من أهل الصلاة", en: "People of prayer" }, { ar: "سجّل الصلوات الخمس كاملة في متتبع الصلاة 100 يوم", en: "Log all five prayers in the prayer tracker on 100 days" }],
  ]),
  ...ladder("prayer_streak", "prayer", "prayerBestStreak", ROW, [
    ["bronze", 3, { ar: "بداية الثبات", en: "Steady start" }, { ar: "حافظ على الصلوات الخمس 3 أيام متتالية", en: "Keep all five prayers 3 days in a row" }],
    ["silver", 14, { ar: "ثبات أسبوعين", en: "Two steady weeks" }, { ar: "حافظ على الصلوات الخمس 14 يومًا متتالية", en: "Keep all five prayers 14 days in a row" }],
    ["gold", 40, { ar: "أربعون يومًا", en: "Forty days" }, { ar: "حافظ على الصلوات الخمس 40 يومًا متتالية دون انقطاع", en: "Keep all five prayers 40 days in a row without a break" }],
  ]),
  ...ladder("fajr_jamaah", "prayer", "fajrJamaah", { ar: "مرة", en: "times" }, [
    ["bronze", 7, { ar: "نور الفجر", en: "Light of Fajr" }, { ar: "صلِّ الفجر في جماعة وسجّلها 7 مرات", en: "Pray Fajr in congregation and log it 7 times" }],
    ["silver", 30, { ar: "حارس الفجر", en: "Guardian of Fajr" }, { ar: "صلِّ الفجر في جماعة وسجّلها 30 مرة", en: "Pray Fajr in congregation and log it 30 times" }],
    ["gold", 100, { ar: "في ذمة الله", en: "Under Allah's protection" }, { ar: "صلِّ الفجر في جماعة وسجّلها 100 مرة", en: "Pray Fajr in congregation and log it 100 times" }],
  ]),
  ...ladder("quran_pages", "quran", "quranPages", { ar: "صفحة", en: "pages" }, [
    ["bronze", 20, { ar: "صاحب الورد", en: "Keeper of the wird" }, { ar: "اقرأ 20 صفحة من المصحف ضمن ختمتك", en: "Read 20 pages of the mushaf in your khatma" }],
    ["silver", 150, { ar: "رفيق المصحف", en: "Companion of the mushaf" }, { ar: "اقرأ 150 صفحة من المصحف ضمن ختمتك", en: "Read 150 pages of the mushaf in your khatma" }],
    ["gold", 604, { ar: "قارئ المصحف", en: "Reader of the mushaf" }, { ar: "اقرأ 604 صفحات، ما يعادل المصحف كاملًا", en: "Read 604 pages, the whole mushaf" }],
  ]),
  ...ladder("khatma", "quran", "khatmas", { ar: "ختمة", en: "khatmas" }, [
    ["silver", 1, { ar: "الختمة الأولى", en: "First khatma" }, { ar: "أتمم ختمة كاملة للقرآن في قسم الختمة", en: "Complete a full khatma of the Quran" }],
    ["gold", 3, { ar: "صاحب الختمات", en: "Many khatmas" }, { ar: "أتمم 3 ختمات كاملة للقرآن في قسم الختمة", en: "Complete 3 full khatmas of the Quran" }],
  ]),
  ...ladder("azkar_days", "dhikr", "azkarFullDays", DAY, [
    ["bronze", 7, { ar: "ذاكر الصباح والمساء", en: "Morning & evening dhikr" }, { ar: "اقرأ أذكار الصباح والمساء وسجّلها معًا 7 أيام", en: "Read and log both morning and evening azkar on 7 days" }],
    ["silver", 30, { ar: "في حفظ الله", en: "In Allah's care" }, { ar: "اقرأ أذكار الصباح والمساء وسجّلها معًا 30 يومًا", en: "Read and log both morning and evening azkar on 30 days" }],
    ["gold", 100, { ar: "من الذاكرين", en: "Among those who remember" }, { ar: "اقرأ أذكار الصباح والمساء وسجّلها معًا 100 يوم", en: "Read and log both morning and evening azkar on 100 days" }],
  ]),
  ...ladder("azkar_streak", "dhikr", "azkarBestStreak", ROW, [
    ["bronze", 3, { ar: "مداوم على الذكر", en: "Constant in dhikr" }, { ar: "أذكار الصباح والمساء 3 أيام متتالية", en: "Morning and evening azkar 3 days in a row" }],
    ["silver", 14, { ar: "ورد لا ينقطع", en: "Unbroken wird" }, { ar: "أذكار الصباح والمساء 14 يومًا متتالية", en: "Morning and evening azkar 14 days in a row" }],
    ["gold", 40, { ar: "لسان رطب بذكر الله", en: "A tongue moist with dhikr" }, { ar: "أذكار الصباح والمساء 40 يومًا متتالية", en: "Morning and evening azkar 40 days in a row" }],
  ]),
  ...ladder("tasbeeh", "dhikr", "tasbeehTotal", { ar: "تسبيحة", en: "tasbeeh" }, [
    ["bronze", 1000, { ar: "ألف تسبيحة", en: "A thousand tasbeeh" }, { ar: "سبّح 1000 مرة في المسبحة", en: "Count 1,000 tasbeeh on the counter" }],
    ["silver", 10000, { ar: "عشرة آلاف تسبيحة", en: "Ten thousand tasbeeh" }, { ar: "سبّح 10000 مرة في المسبحة", en: "Count 10,000 tasbeeh on the counter" }],
    ["gold", 100000, { ar: "مئة ألف تسبيحة", en: "A hundred thousand tasbeeh" }, { ar: "سبّح 100000 مرة في المسبحة", en: "Count 100,000 tasbeeh on the counter" }],
  ]),
  ...ladder("fast_days", "fasting", "fastDays", DAY, [
    ["bronze", 3, { ar: "أول الصيام", en: "First fasts" }, { ar: "سجّل 3 أيام صيام في متتبع الصيام", en: "Log 3 fasting days in the fasting tracker" }],
    ["silver", 15, { ar: "صائم محتسب", en: "Devoted faster" }, { ar: "سجّل 15 يوم صيام في متتبع الصيام", en: "Log 15 fasting days in the fasting tracker" }],
    ["gold", 40, { ar: "من أهل الريّان", en: "People of Ar-Rayyan" }, { ar: "سجّل 40 يوم صيام في متتبع الصيام", en: "Log 40 fasting days in the fasting tracker" }],
  ]),
  ...ladder("white_days", "fasting", "whiteDays", DAY, [
    ["bronze", 3, { ar: "الأيام البيض", en: "The white days" }, { ar: "صم الأيام البيض (13 و14 و15 هجريًا) وسجّلها 3 أيام", en: "Fast the white days (13th–15th Hijri) and log 3 of them" }],
    ["silver", 9, { ar: "مداوم على البيض", en: "Regular on the white days" }, { ar: "صم الأيام البيض وسجّلها 9 أيام", en: "Fast the white days and log 9 of them" }],
    ["gold", 36, { ar: "كصيام الدهر", en: "Like fasting a lifetime" }, { ar: "صم الأيام البيض وسجّلها 36 يومًا (سنة كاملة)", en: "Fast the white days and log 36 of them (a full year)" }],
  ]),
  ...ladder("qiyam", "nawafil", "qiyamNights", NIGHT, [
    ["bronze", 3, { ar: "قائم الليل", en: "Night worshipper" }, { ar: "سجّل قيام الليل 3 ليالٍ", en: "Log the night prayer on 3 nights" }],
    ["silver", 20, { ar: "المستغفر بالأسحار", en: "Seeker of forgiveness at dawn" }, { ar: "سجّل قيام الليل 20 ليلة", en: "Log the night prayer on 20 nights" }],
    ["gold", 60, { ar: "دأب الصالحين", en: "Way of the righteous" }, { ar: "سجّل قيام الليل 60 ليلة", en: "Log the night prayer on 60 nights" }],
  ]),
  ...ladder("rawatib", "nawafil", "rawatibFullDays", DAY, [
    ["bronze", 3, { ar: "بيت في الجنة", en: "A house in Paradise" }, { ar: "صلِّ السنن الرواتب الاثنتي عشرة ركعة كاملة 3 أيام", en: "Pray all twelve rawatib rak'ahs on 3 days" }],
    ["silver", 14, { ar: "محافظ على الرواتب", en: "Keeper of the rawatib" }, { ar: "صلِّ السنن الرواتب كاملة 14 يومًا", en: "Pray all the rawatib on 14 days" }],
    ["gold", 40, { ar: "حبيب النوافل", en: "Lover of voluntary prayer" }, { ar: "صلِّ السنن الرواتب كاملة 40 يومًا", en: "Pray all the rawatib on 40 days" }],
  ]),
  ...ladder("witr", "nawafil", "witrDays", NIGHT, [
    ["bronze", 7, { ar: "أهل الوتر", en: "People of witr" }, { ar: "صلِّ الوتر وسجّله 7 ليالٍ", en: "Pray witr and log it on 7 nights" }],
    ["silver", 30, { ar: "وتر كل ليلة", en: "Witr every night" }, { ar: "صلِّ الوتر وسجّله 30 ليلة", en: "Pray witr and log it on 30 nights" }],
    ["gold", 100, { ar: "لا يدع الوتر", en: "Never leaves witr" }, { ar: "صلِّ الوتر وسجّله 100 ليلة", en: "Pray witr and log it on 100 nights" }],
  ]),
  ...ladder("nawawi", "knowledge", "nawawiMemorized", { ar: "حديث", en: "hadiths" }, [
    ["bronze", 5, { ar: "حافظ الحديث", en: "Hadith memorizer" }, { ar: "احفظ 5 أحاديث من الأربعين النووية", en: "Memorize 5 hadiths of the Forty Nawawi" }],
    ["silver", 20, { ar: "نصف الأربعين", en: "Half of the Forty" }, { ar: "احفظ 20 حديثًا من الأربعين النووية", en: "Memorize 20 hadiths of the Forty Nawawi" }],
    ["gold", 42, { ar: "حافظ الأربعين", en: "Memorizer of the Forty" }, { ar: "احفظ الأربعين النووية كاملة (42 حديثًا)", en: "Memorize all of the Forty Nawawi (42 hadiths)" }],
  ]),
  ...ladder("names", "knowledge", "namesMemorized", { ar: "اسم", en: "names" }, [
    ["bronze", 10, { ar: "معرفة الله", en: "Knowing Allah" }, { ar: "احفظ 10 من أسماء الله الحسنى", en: "Memorize 10 of the Beautiful Names of Allah" }],
    ["silver", 50, { ar: "نصف الأسماء", en: "Half of the Names" }, { ar: "احفظ 50 من أسماء الله الحسنى", en: "Memorize 50 of the Beautiful Names of Allah" }],
    ["gold", 99, { ar: "من أحصاها", en: "Whoever enumerates them" }, { ar: "احفظ أسماء الله الحسنى التسعة والتسعين", en: "Memorize all ninety-nine Names of Allah" }],
  ]),
  ...ladder("quiz", "knowledge", "quizCorrect", { ar: "إجابة", en: "answers" }, [
    ["bronze", 25, { ar: "متعلّم", en: "Learner" }, { ar: "أجب إجابة صحيحة عن 25 سؤالًا في المسابقة الإسلامية", en: "Answer 25 questions correctly in the Islamic quiz" }],
    ["silver", 100, { ar: "طالب علم", en: "Student of knowledge" }, { ar: "أجب إجابة صحيحة عن 100 سؤال في المسابقة الإسلامية", en: "Answer 100 questions correctly in the Islamic quiz" }],
    ["gold", 500, { ar: "شغوف بالعلم", en: "Passionate for knowledge" }, { ar: "أجب إجابة صحيحة عن 500 سؤال في المسابقة الإسلامية", en: "Answer 500 questions correctly in the Islamic quiz" }],
  ]),
  ...ladder("journal", "journal", "journalEntries", { ar: "إنجاز", en: "entries" }, [
    ["bronze", 1, { ar: "الخطوة الأولى", en: "The first step" }, { ar: "سجّل أول إنجاز إيماني في سجلّك", en: "Log your first good deed in your journal" }],
    ["silver", 25, { ar: "محاسب لنفسه", en: "Self-accountable" }, { ar: "سجّل 25 إنجازًا إيمانيًا في سجلّك", en: "Log 25 good deeds in your journal" }],
    ["gold", 100, { ar: "دفتر الحسنات", en: "Book of good deeds" }, { ar: "سجّل 100 إنجاز إيماني في سجلّك", en: "Log 100 good deeds in your journal" }],
  ]),
];

/** Where to make progress on a metric (routeForMetric). */
export const METRIC_ROUTE: Partial<Record<Metric, string>> = {
  prayerFullDays: "/prayer-tracker",
  prayerBestStreak: "/prayer-tracker",
  fajrJamaah: "/prayer-tracker",
  quranPages: "/khatma",
  khatmas: "/khatma",
  azkarFullDays: "/azkar-tracker",
  azkarBestStreak: "/azkar-tracker",
  tasbeehTotal: "/tasbeeh",
  fastDays: "/fasting-tracker",
  whiteDays: "/fasting-tracker",
  qiyamNights: "/night-prayer",
  rawatibFullDays: "/sunan",
  witrDays: "/sunan",
  nawawiMemorized: "/nawawi",
  namesMemorized: "/names-of-allah",
  quizCorrect: "/quiz",
};

export const LEVELS = [0, 60, 180, 400, 750, 1100];

const RAWATIB = ["fajr_before", "dhuhr_before", "dhuhr_after", "maghrib_after", "isha_after"];
const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export function longestRun(days: Set<string>) {
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Run ending today, or yesterday so an unfinished today doesn't break it. */
export function currentRun(days: Set<string>, today: string) {
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export type Signals = {
  values: Record<Metric, number>;
  prayerStreak: number;
  azkarStreak: number;
  lastPage: number;
  totalFasts: number;
};

/** AchievementSignals.fromSnapshot, from localStorage. Client only. */
export function readSignals(today: string, journalCount: number): Signals {
  const prayerLog = obj(read("yusr.prayer-tracker.log", {}));
  const prayerFull = new Set<string>();
  let fajrJamaah = 0;
  for (const [day, v] of Object.entries(prayerLog)) {
    const p = obj(v);
    if (PRAYERS.every((k) => p[k] && p[k] !== "missed")) prayerFull.add(day);
    if (p.fajr === "jamaah") fajrJamaah++;
  }

  const azkarLog = obj(read("yusr.azkar-tracker.log", {}));
  const azkarFull = new Set(Object.entries(azkarLog).filter(([, v]) => obj(v).morning && obj(v).evening).map(([d]) => d));

  const fasts = Object.values(obj(read("yusr.fasting-tracker.log", {}))).filter((v) => typeof v === "string" && v !== "missed");

  let completed = 0;
  let activeBest = 0;
  const plans = read<unknown>("yusr.khatma.plans", []);
  for (const plan of Array.isArray(plans) ? plans : []) {
    const current = Math.max(0, Number(obj(plan).currentPage) || 0);
    if (current >= 604) completed++;
    else activeBest = Math.max(activeBest, Math.min(604, current));
  }

  const qiyam = Object.values(obj(read("yusr.night-prayer.log", {}))).filter((v) => Number(v) > 0).length;

  let rawatib = 0;
  let witr = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith("yusr.sunan.") || !/\d{4}-\d{2}-\d{2}$/.test(k)) continue;
      const ids = read<unknown>(k, []);
      if (!Array.isArray(ids)) continue;
      if (RAWATIB.every((r) => ids.includes(r))) rawatib++;
      if (ids.includes("witr")) witr++;
    }
  } catch {}

  const lastPage = Number(read("yusr.quran.lastPage", 0)) || 0;

  return {
    values: {
      prayerFullDays: prayerFull.size,
      prayerBestStreak: longestRun(prayerFull),
      fajrJamaah,
      quranPages: completed * 604 + activeBest,
      khatmas: completed,
      azkarFullDays: azkarFull.size,
      azkarBestStreak: longestRun(azkarFull),
      tasbeehTotal: Number(read("yusr.tasbeeh", 0)) || 0,
      fastDays: fasts.length,
      whiteDays: fasts.filter((f) => f === "white_days").length,
      qiyamNights: qiyam,
      rawatibFullDays: rawatib,
      witrDays: witr,
      nawawiMemorized: 0,
      namesMemorized: 0,
      quizCorrect: Number(obj(read("yusr.quiz.stats", {})).correct) || 0,
      journalEntries: journalCount,
    },
    prayerStreak: currentRun(prayerFull, today),
    azkarStreak: currentRun(azkarFull, today),
    lastPage,
    totalFasts: fasts.length,
  };
}

export const levelIndex = (points: number) => LEVELS.reduce((i, min, idx) => (points >= min ? idx : i), 0);

export const JOURNAL_CATEGORIES = ["quran", "prayer", "charity", "fasting", "dhikr", "other"] as const;
export type JournalCategory = (typeof JOURNAL_CATEGORIES)[number];
export type JournalEntry = { id: string; text: string; category: JournalCategory; message?: string; date: string };
