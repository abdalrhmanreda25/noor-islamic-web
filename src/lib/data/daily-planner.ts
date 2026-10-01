// Daily planner (lib/features/daily_planner): tasks grouped by the prayer
// periods of the day, with ready-made templates and routines.
//
// Storage:
//   "yusr.daily-planner.items" = PlannerItem[]  (deleted items are kept, flagged,
//                                               so past days still show their titles)
//   "yusr.daily-planner.log"   = { [YYYY-MM-DD]: { [itemId]: boolean } }
//                                a day has a record once the planner was opened on it.
import { addDays, daysBetween } from "./hijri";

export const ITEMS_KEY = "yusr.daily-planner.items";
export const LOG_KEY = "yusr.daily-planner.log";

export const PERIODS = ["before_fajr", "fajr", "duha", "dhuhr", "asr", "maghrib", "isha", "sleep", "anytime"] as const;
export type Period = (typeof PERIODS)[number];

export type PlannerItem = {
  id: string;
  /** Custom title; falls back to the template's localized title. */
  title?: string;
  period: Period;
  templateKey?: string;
  builtin?: boolean;
  deleted?: boolean;
  sort: number;
};
export type PlannerLog = Record<string, Record<string, boolean>>;

export type PlannerTemplate = {
  key: string;
  period: Period;
  route?: string;
  ar: string;
  en: string;
  evidence: string;
  source: { ar: string; en: string };
};

const TWELVE = "«ما من عبد مسلم يصلي لله كل يوم ثنتي عشرة ركعة تطوعًا غير فريضة إلا بنى الله له بيتًا في الجنة»";
const TAHA = "﴿وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ غُرُوبِهَا﴾";
const MUSLIM = { ar: "رواه مسلم", en: "Muslim" };
const AGREED = { ar: "متفق عليه", en: "Agreed upon" };

export const TEMPLATES: PlannerTemplate[] = [
  { key: "qiyam", period: "before_fajr", route: "/night-prayer", ar: "قيام الليل", en: "Night prayer (qiyam)", evidence: "«أفضل الصلاة بعد الفريضة صلاة الليل»", source: MUSLIM },
  { key: "sahar_istighfar", period: "before_fajr", ar: "الاستغفار بالأسحار", en: "Istighfar before dawn", evidence: "﴿وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ﴾", source: { ar: "الذاريات: 18", en: "Adh-Dhariyat: 18" } },
  { key: "last_third_dua", period: "before_fajr", ar: "الدعاء في الثلث الأخير", en: "Dua in the last third of the night", evidence: "«ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا حين يبقى ثلث الليل الآخر، يقول: من يدعوني فأستجيب له»", source: AGREED },
  { key: "suhoor", period: "before_fajr", ar: "السحور (لمن يصوم)", en: "Suhoor (if fasting)", evidence: "«تسحّروا فإن في السحور بركة»", source: AGREED },
  { key: "sunnah_fajr", period: "fajr", ar: "سنة الفجر (ركعتان)", en: "Sunnah of Fajr (2 rak'ahs)", evidence: "«ركعتا الفجر خير من الدنيا وما فيها»", source: MUSLIM },
  { key: "fajr_prayer", period: "fajr", ar: "صلاة الفجر في وقتها", en: "Fajr prayer on time", evidence: "«من صلى الصبح فهو في ذمة الله»", source: MUSLIM },
  { key: "morning_azkar", period: "fajr", route: "/azkar", ar: "أذكار الصباح", en: "Morning azkar", evidence: TAHA, source: { ar: "طه: 130", en: "Ta-Ha: 130" } },
  { key: "quran_wird", period: "fajr", route: "/quran", ar: "ورد القرآن", en: "Quran wird", evidence: "«اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعًا لأصحابه»", source: MUSLIM },
  { key: "sit_till_sunrise", period: "fajr", ar: "الجلوس في المصلى حتى الشروق", en: "Sitting in the prayer place until sunrise", evidence: "كان النبي ﷺ إذا صلى الفجر جلس في مصلاه حتى تطلع الشمس حَسَنًا", source: MUSLIM },
  { key: "duha", period: "duha", ar: "صلاة الضحى", en: "Duha prayer", evidence: "«يُصبح على كل سُلامى من أحدكم صدقة… ويُجزئ من ذلك ركعتان يركعهما من الضحى»", source: MUSLIM },
  { key: "seek_knowledge", period: "duha", ar: "درس علم نافع", en: "A lesson of beneficial knowledge", evidence: "«من سلك طريقًا يلتمس فيه علمًا سهّل الله له به طريقًا إلى الجنة»", source: MUSLIM },
  { key: "rawatib_dhuhr", period: "dhuhr", route: "/sunan", ar: "سنة الظهر (٤ قبلها و٢ بعدها)", en: "Sunnah of Dhuhr (4 before, 2 after)", evidence: TWELVE, source: MUSLIM },
  { key: "asr_prayer", period: "asr", ar: "المحافظة على صلاة العصر", en: "Guarding the Asr prayer", evidence: "«من صلى البَرْدَين دخل الجنة»", source: AGREED },
  { key: "evening_azkar", period: "asr", route: "/azkar", ar: "أذكار المساء", en: "Evening azkar", evidence: TAHA, source: { ar: "طه: 130", en: "Ta-Ha: 130" } },
  { key: "sunnah_maghrib", period: "maghrib", ar: "سنة المغرب (ركعتان)", en: "Sunnah of Maghrib (2 rak'ahs)", evidence: TWELVE, source: MUSLIM },
  { key: "dua_adhan_iqama", period: "maghrib", ar: "الدعاء بين الأذان والإقامة", en: "Dua between adhan and iqamah", evidence: "«الدعاء لا يُرَدّ بين الأذان والإقامة»", source: { ar: "رواه أبو داود والترمذي", en: "Abu Dawud and At-Tirmidhi" } },
  { key: "isha_jamaah", period: "isha", ar: "صلاة العشاء في جماعة", en: "Isha in congregation", evidence: "«من صلى العشاء في جماعة فكأنما قام نصف الليل»", source: MUSLIM },
  { key: "sunnah_isha", period: "isha", ar: "سنة العشاء (ركعتان)", en: "Sunnah of Isha (2 rak'ahs)", evidence: TWELVE, source: MUSLIM },
  { key: "witr", period: "isha", ar: "صلاة الوتر", en: "Witr prayer", evidence: "«اجعلوا آخر صلاتكم بالليل وترًا»", source: AGREED },
  { key: "surat_mulk", period: "isha", ar: "قراءة سورة الملك", en: "Reading Surah Al-Mulk", evidence: "«إن سورة من القرآن ثلاثون آية شفعت لرجل حتى غُفر له، وهي: تبارك الذي بيده الملك»", source: { ar: "رواه أبو داود والترمذي", en: "Abu Dawud and At-Tirmidhi" } },
  { key: "sleep_azkar", period: "sleep", route: "/azkar", ar: "أذكار النوم", en: "Sleep azkar", evidence: "«إذا أويتما إلى فراشكما فكبّرا أربعًا وثلاثين، وسبّحا ثلاثًا وثلاثين، واحمدا ثلاثًا وثلاثين»", source: AGREED },
  { key: "wudu_before_sleep", period: "sleep", ar: "الوضوء قبل النوم", en: "Wudu before sleeping", evidence: "«إذا أتيت مضجعك فتوضأ وضوءك للصلاة، ثم اضطجع على شقك الأيمن»", source: AGREED },
  { key: "baqarah_end", period: "sleep", ar: "خواتيم سورة البقرة", en: "The last two ayahs of Al-Baqarah", evidence: "«من قرأ بالآيتين من آخر سورة البقرة في ليلة كفتاه»", source: AGREED },
  { key: "muhasaba", period: "sleep", ar: "محاسبة النفس", en: "Self-reckoning", evidence: "﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ﴾", source: { ar: "الحشر: 18", en: "Al-Hashr: 18" } },
  { key: "post_prayer_azkar", period: "anytime", route: "/azkar", ar: "أذكار بعد الصلاة", en: "Azkar after prayer", evidence: "«من سبّح الله في دبر كل صلاة ثلاثًا وثلاثين، وحمد الله ثلاثًا وثلاثين، وكبّر الله ثلاثًا وثلاثين…»", source: MUSLIM },
  { key: "salawat", period: "anytime", ar: "الصلاة على النبي ﷺ (١٠٠)", en: "Salawat on the Prophet ﷺ (100)", evidence: "«من صلى عليّ صلاةً صلى الله عليه بها عشرًا»", source: MUSLIM },
  { key: "istighfar", period: "anytime", ar: "الاستغفار (١٠٠)", en: "Istighfar (100)", evidence: "«إني لأستغفر الله في اليوم مائة مرة»", source: MUSLIM },
  { key: "tasbeeh_100", period: "anytime", route: "/tasbeeh", ar: "سبحان الله وبحمده (١٠٠)", en: "SubhanAllah wa bihamdih (100)", evidence: "«من قال: سبحان الله وبحمده، في يوم مائة مرة، حُطّت خطاياه وإن كانت مثل زَبَد البحر»", source: AGREED },
  { key: "tahlil_100", period: "anytime", route: "/tasbeeh", ar: "لا إله إلا الله وحده لا شريك له… (١٠٠)", en: "La ilaha illallah wahdahu la sharika lah… (100)", evidence: "«…كانت له عدل عشر رقاب، وكُتبت له مائة حسنة، ومُحيت عنه مائة سيئة، وكانت له حرزًا من الشيطان يومه ذلك حتى يمسي»", source: AGREED },
  { key: "sadaqa", period: "anytime", ar: "صدقة اليوم", en: "Today's charity", evidence: "«ما من يوم يُصبح العباد فيه إلا مَلَكان ينزلان، فيقول أحدهما: اللهم أعطِ منفقًا خلفًا»", source: AGREED },
  { key: "parents", period: "anytime", ar: "بر الوالدين", en: "Kindness to parents", evidence: "﴿وَبِالْوَالِدَيْنِ إِحْسَانًا﴾", source: { ar: "الإسراء: 23", en: "Al-Isra: 23" } },
  { key: "kinship", period: "anytime", ar: "صلة الرحم", en: "Keeping family ties", evidence: "«من أحب أن يُبسط له في رزقه ويُنسأ له في أثره فليصل رحمه»", source: AGREED },
];

export const ROUTINES = [
  { key: "essentials", templateKeys: ["morning_azkar", "quran_wird", "evening_azkar", "istighfar", "sleep_azkar"] },
  { key: "sunan", templateKeys: ["sunnah_fajr", "duha", "rawatib_dhuhr", "sunnah_maghrib", "sunnah_isha", "witr"] },
  { key: "night", templateKeys: ["qiyam", "sahar_istighfar", "last_third_dua", "surat_mulk", "baqarah_end", "muhasaba"] },
] as const;

/** kPlannerDefaults: the built-in tasks of a fresh planner. */
export const DEFAULT_KEYS = ["morning_azkar", "evening_azkar", "quran_wird", "salawat", "istighfar", "sadaqa", "witr", "duha"];

export const templateByKey = (key?: string) => TEMPLATES.find((t) => t.key === key);

export const itemTitle = (item: PlannerItem, locale: string) =>
  item.title ?? templateByKey(item.templateKey)?.[locale === "ar" ? "ar" : "en"] ?? "";

export const defaultItems = (): PlannerItem[] =>
  DEFAULT_KEYS.map((k, i) => ({ id: `d-${k}`, templateKey: k, period: templateByKey(k)!.period, builtin: true, sort: i }));

/** Completion 0..1 of each day that has a record. */
export function percents(log: PlannerLog) {
  const out: Record<string, number> = {};
  for (const [day, entries] of Object.entries(log)) {
    const vals = Object.values(entries);
    out[day] = vals.length ? vals.filter(Boolean).length / vals.length : 0;
  }
  return out;
}

export const STREAK_THRESHOLD = 0.8;

export function currentStreak(p: Record<string, number>, today: string) {
  let count = (p[today] ?? 0) >= STREAK_THRESHOLD ? 1 : 0;
  let day = addDays(today, -1);
  while ((p[day] ?? 0) >= STREAK_THRESHOLD) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

export function bestStreak(p: Record<string, number>) {
  const days = Object.keys(p).filter((d) => p[d] >= STREAK_THRESHOLD).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function monthStats(p: Record<string, number>, monthPrefix: string) {
  const vals = Object.entries(p)
    .filter(([k]) => k.startsWith(monthPrefix))
    .map(([, v]) => v);
  return {
    tracked: vals.length,
    complete: vals.filter((v) => v >= 1).length,
    good: vals.filter((v) => v >= STREAK_THRESHOLD).length,
    average: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
  };
}
