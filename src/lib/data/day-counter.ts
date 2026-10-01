// Day counters ("عدّاد الأيام"), ported from lib/features/day_counter.
// Storage: localStorage "yusr.day-counter.challenges" = DayChallenge[] (same
// JSON shape as the app's `day_counters_v1`).
import { addDays, daysBetween, todayKey } from "./hijri";

export const CHALLENGES_KEY = "yusr.day-counter.challenges";

export type DayCountMode = "manual" | "auto" | "countdown";

export type DayChallenge = {
  id: string;
  title: string;
  targetDays: number;
  /** YYYY-MM-DD */
  startedOn: string;
  completedDates: string[];
  importedDays?: number;
  accent: number;
  mode: DayCountMode;
  /** YYYY-MM-DD, countdown only */
  targetDate?: string | null;
  templateId?: string | null;
  paused?: boolean;
};

const countdownStart = (c: DayChallenge, today: string) => (daysBetween(c.startedOn, today) < 0 ? today : c.startedOn);

export function targetDays(c: DayChallenge, today = todayKey()) {
  if (c.mode !== "countdown") return c.targetDays;
  const start = countdownStart(c, today);
  const span = daysBetween(start, c.targetDate ?? start);
  return span > 0 ? span : 1;
}

export function completedDays(c: DayChallenge, today = todayKey()) {
  const total = targetDays(c, today);
  if (c.mode === "manual") return (c.importedDays ?? 0) + c.completedDates.length;
  if (c.mode === "auto") {
    const diff = daysBetween(c.startedOn, today);
    return diff < 0 ? 0 : Math.min(diff + 1, total);
  }
  const diff = daysBetween(countdownStart(c, today), today);
  return diff < 0 ? 0 : Math.min(diff, total);
}

export const remainingDays = (c: DayChallenge, today = todayKey()) =>
  Math.max(0, targetDays(c, today) - completedDays(c, today));
export const isComplete = (c: DayChallenge, today = todayKey()) => completedDays(c, today) >= targetDays(c, today);
export const progress = (c: DayChallenge, today = todayKey()) =>
  Math.min(1, completedDays(c, today) / Math.max(1, targetDays(c, today)));

export function isDone(c: DayChallenge, date: string, today = todayKey()) {
  if (c.mode === "manual") return c.completedDates.includes(date);
  const diff = daysBetween(c.mode === "countdown" ? countdownStart(c, today) : c.startedOn, date);
  return diff >= 0 && diff < completedDays(c, today);
}

export function currentStreak(c: DayChallenge, today = todayKey()) {
  if (c.mode === "countdown") return 0;
  if (c.mode === "auto") return completedDays(c, today);
  const set = new Set(c.completedDates);
  let offset = 0;
  if (!set.has(today)) {
    offset = 1;
    if (!set.has(addDays(today, -1))) return 0;
  }
  let streak = 0;
  while (set.has(addDays(today, -(offset + streak)))) streak++;
  return streak;
}

export function bestStreak(c: DayChallenge, today = todayKey()) {
  if (c.mode === "countdown") return 0;
  if (c.mode === "auto") return completedDays(c, today);
  const days = [...c.completedDates].sort();
  if (!days.length) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = daysBetween(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export const canToggle = (c: DayChallenge, date: string, today = todayKey()) =>
  c.mode === "manual" && date <= today && date >= c.startedOn;

export function doneInMonth(c: DayChallenge, monthStart: string, today = todayKey()) {
  const [y, m] = monthStart.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let count = 0;
  for (let d = 0; d < last; d++) {
    const key = addDays(monthStart, d);
    if (key > today) break;
    if (isDone(c, key, today)) count++;
  }
  return count;
}

/** Running first, then paused, then finished; newest first in each group. */
export const ordered = (list: DayChallenge[], today = todayKey()) =>
  [...list].sort((a, b) => {
    const ca = isComplete(a, today);
    const cb = isComplete(b, today);
    if (ca !== cb) return ca ? 1 : -1;
    if (!!a.paused !== !!b.paused) return a.paused ? 1 : -1;
    return b.startedOn.localeCompare(a.startedOn);
  });

export const CATEGORIES = ["prayer", "quranDhikr", "fastingCharity", "character"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Template = {
  id: string;
  days: number;
  accent: number;
  category: Category;
  ar: { title: string; description: string; quote: string; source: string };
  en: { title: string; description: string; quote: string; source: string };
};

/** kDayCounterTemplates, with English translations. */
export const TEMPLATES: Template[] = [
  {
    id: "salah_on_time", days: 40, accent: 0, category: "prayer",
    ar: { title: "الصلوات في وقتها", description: "أدِّ الصلوات الخمس في أول وقتها كل يوم.", quote: "«سألت النبي ﷺ: أيُّ العمل أحبُّ إلى الله؟ قال: الصلاةُ على وقتها»", source: "متفق عليه" },
    en: { title: "Prayers on time", description: "Pray the five prayers at the start of their time every day.", quote: "“I asked the Prophet ﷺ: Which deed is most beloved to Allah? He said: Prayer on its time.”", source: "Agreed upon" },
  },
  {
    id: "takbirat_ihram_40", days: 40, accent: 1, category: "prayer",
    ar: { title: "تكبيرة الإحرام أربعين يومًا", description: "أدرك التكبيرة الأولى مع الجماعة في الصلوات كلها.", quote: "«من صلّى لله أربعين يومًا في جماعة يُدرك التكبيرة الأولى كُتبت له براءتان: براءةٌ من النار، وبراءةٌ من النفاق»", source: "رواه الترمذي" },
    en: { title: "First takbir for 40 days", description: "Catch the opening takbir with the congregation in every prayer.", quote: "“Whoever prays to Allah for forty days in congregation, catching the first takbir, two freedoms are written for him: freedom from the Fire and freedom from hypocrisy.”", source: "At-Tirmidhi" },
  },
  {
    id: "rawatib", days: 30, accent: 3, category: "prayer",
    ar: { title: "السنن الرواتب", description: "اثنتا عشرة ركعة: ٤ قبل الظهر و٢ بعده، ٢ بعد المغرب و٢ بعد العشاء، و٢ قبل الفجر.", quote: "«من صلّى اثنتي عشرة ركعةً في يومٍ وليلة بُني له بهنّ بيتٌ في الجنة»", source: "رواه مسلم" },
    en: { title: "Sunnah rawatib", description: "Twelve rak'ahs: 4 before Dhuhr and 2 after, 2 after Maghrib, 2 after Isha and 2 before Fajr.", quote: "“Whoever prays twelve rak'ahs in a day and night, a house is built for him in Paradise.”", source: "Muslim" },
  },
  {
    id: "qiyam", days: 30, accent: 2, category: "prayer",
    ar: { title: "قيام الليل", description: "ولو ركعتين قبل النوم أو في آخر الليل، وأوتر.", quote: "«أفضلُ الصلاة بعد الفريضة صلاةُ الليل»", source: "رواه مسلم" },
    en: { title: "Night prayer", description: "Even two rak'ahs before sleeping or late at night, then witr.", quote: "“The best prayer after the obligatory ones is the night prayer.”", source: "Muslim" },
  },
  {
    id: "duha", days: 30, accent: 1, category: "prayer",
    ar: { title: "صلاة الضحى", description: "ركعتان على الأقل بعد ارتفاع الشمس وقبل الظهر.", quote: "«يُصبح على كل سُلامى من أحدكم صدقة… ويُجزئ من ذلك ركعتان يركعهما من الضحى»", source: "رواه مسلم" },
    en: { title: "Duha prayer", description: "At least two rak'ahs after the sun rises and before Dhuhr.", quote: "“Charity is due on every joint of each of you every morning… and two rak'ahs of Duha suffice for that.”", source: "Muslim" },
  },
  {
    id: "quran_wird", days: 30, accent: 3, category: "quranDhikr",
    ar: { title: "وِرد قرآني يومي", description: "اقرأ وردك اليومي ولو صفحة واحدة، بتدبّر.", quote: "«اقرؤوا القرآن، فإنه يأتي يوم القيامة شفيعًا لأصحابه»", source: "رواه مسلم" },
    en: { title: "Daily Quran wird", description: "Read your daily portion, even one page, with reflection.", quote: "“Read the Quran, for it will come on the Day of Resurrection as an intercessor for its companions.”", source: "Muslim" },
  },
  {
    id: "morning_evening_adhkar", days: 30, accent: 0, category: "quranDhikr",
    ar: { title: "أذكار الصباح والمساء", description: "حافظ على أذكار الصباح بعد الفجر وأذكار المساء بعد العصر.", quote: "﴿وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ الْغُرُوبِ﴾", source: "سورة ق: 39" },
    en: { title: "Morning & evening adhkar", description: "Keep the morning adhkar after Fajr and the evening adhkar after Asr.", quote: "﴿وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ الْغُرُوبِ﴾", source: "Surah Qaf: 39" },
  },
  {
    id: "surah_mulk", days: 30, accent: 2, category: "quranDhikr",
    ar: { title: "سورة الملك كل ليلة", description: "اقرأ سورة الملك قبل أن تنام.", quote: "«سورةٌ من القرآن ثلاثون آية شفعت لرجلٍ حتى غُفر له، وهي: تبارك الذي بيده الملك»", source: "رواه الترمذي وأبو داود" },
    en: { title: "Surah Al-Mulk every night", description: "Read Surah Al-Mulk before you sleep.", quote: "“A surah of the Quran of thirty ayahs interceded for a man until he was forgiven: Tabarak alladhi biyadihi al-mulk.”", source: "At-Tirmidhi and Abu Dawud" },
  },
  {
    id: "istighfar_100", days: 40, accent: 5, category: "quranDhikr",
    ar: { title: "الاستغفار مئة مرة", description: "قل «أستغفر الله وأتوب إليه» مئة مرة في يومك.", quote: "«إنه ليُغانُ على قلبي، وإني لأستغفر الله في اليوم مئة مرة»", source: "رواه مسلم" },
    en: { title: "Istighfar 100 times", description: "Say “Astaghfirullah wa atubu ilayh” a hundred times in your day.", quote: "“My heart becomes clouded, and I seek Allah's forgiveness a hundred times a day.”", source: "Muslim" },
  },
  {
    id: "salawat", days: 30, accent: 4, category: "quranDhikr",
    ar: { title: "الصلاة على النبي ﷺ", description: "أكثِر من الصلاة على النبي ﷺ، ولو مئة مرة في اليوم.", quote: "«من صلّى عليّ واحدةً صلّى الله عليه بها عشرًا»", source: "رواه مسلم" },
    en: { title: "Salawat on the Prophet ﷺ", description: "Send plenty of blessings on the Prophet ﷺ, even a hundred a day.", quote: "“Whoever sends one blessing on me, Allah sends ten on him.”", source: "Muslim" },
  },
  {
    id: "fast_mon_thu", days: 16, accent: 4, category: "fastingCharity",
    ar: { title: "صيام الاثنين والخميس", description: "سجّل كل يوم تصومه؛ ١٦ يومًا تعادل ثمانية أسابيع.", quote: "«تُعرض الأعمال يوم الاثنين والخميس، فأحبُّ أن يُعرض عملي وأنا صائم»", source: "رواه الترمذي" },
    en: { title: "Fasting Mondays & Thursdays", description: "Log every day you fast; 16 days make eight weeks.", quote: "“Deeds are presented on Monday and Thursday, and I love that my deeds are presented while I am fasting.”", source: "At-Tirmidhi" },
  },
  {
    id: "daily_sadaqa", days: 30, accent: 4, category: "fastingCharity",
    ar: { title: "الصدقة اليومية", description: "تصدّق كل يوم ولو بالقليل، أو بكلمة طيبة.", quote: "«ما نقصت صدقةٌ من مال»", source: "رواه مسلم" },
    en: { title: "Daily charity", description: "Give something every day, however small, or a kind word.", quote: "“Charity never decreases wealth.”", source: "Muslim" },
  },
  {
    id: "no_gheeba", days: 40, accent: 5, category: "character",
    ar: { title: "ترك الغيبة", description: "يوم كامل بلا غيبة ولا نميمة، واحفظ لسانك.", quote: "﴿وَلَا يَغْتَب بَّعْضُكُم بَعْضًا﴾", source: "سورة الحجرات: 12" },
    en: { title: "No backbiting", description: "A full day without backbiting or gossip; guard your tongue.", quote: "﴿وَلَا يَغْتَب بَّعْضُكُم بَعْضًا﴾", source: "Surah Al-Hujurat: 12" },
  },
  {
    id: "birr_walidayn", days: 30, accent: 0, category: "character",
    ar: { title: "بر الوالدين", description: "عمل بِرٍّ واحد كل يوم: اتصال، خدمة، دعاء، هدية.", quote: "﴿وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا﴾", source: "سورة الإسراء: 23" },
    en: { title: "Kindness to parents", description: "One act of kindness every day: a call, a service, a dua, a gift.", quote: "﴿وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا﴾", source: "Surah Al-Isra: 23" },
  },
  {
    id: "silat_rahim", days: 30, accent: 3, category: "character",
    ar: { title: "صلة الرحم", description: "تواصل كل يوم مع قريب: زيارة أو اتصال أو رسالة.", quote: "«من أحبّ أن يُبسط له في رزقه، ويُنسأ له في أثره، فليصل رحمه»", source: "متفق عليه" },
    en: { title: "Keeping family ties", description: "Reach out to a relative every day: a visit, a call or a message.", quote: "“Whoever would like his provision to be expanded and his life prolonged, let him maintain his family ties.”", source: "Agreed upon" },
  },
  {
    id: "no_anger", days: 21, accent: 2, category: "character",
    ar: { title: "ترك الغضب", description: "املك نفسك عند الغضب، وتوضّأ أو اسكت إذا غضبت.", quote: "«أنّ رجلًا قال للنبي ﷺ: أوصني، قال: لا تغضب، فردّد مرارًا، قال: لا تغضب»", source: "رواه البخاري" },
    en: { title: "Leaving anger", description: "Control yourself when angry; make wudu or stay silent.", quote: "“A man said to the Prophet ﷺ: Advise me. He said: Do not become angry. The man repeated it several times, and he said: Do not become angry.”", source: "Al-Bukhari" },
  },
  {
    id: "siwak", days: 30, accent: 4, category: "character",
    ar: { title: "السواك", description: "استعمل السواك عند الوضوء وقبل الصلاة.", quote: "«السواك مَطهرةٌ للفم، مَرضاةٌ للرب»", source: "رواه النسائي" },
    en: { title: "Siwak", description: "Use the siwak at wudu and before prayer.", quote: "“The siwak purifies the mouth and pleases the Lord.”", source: "An-Nasa'i" },
  },
];

export const FEATURED_TEMPLATE_IDS = ["salah_on_time", "morning_evening_adhkar", "quran_wird", "takbirat_ihram_40"];

export const templateById = (id?: string | null) => TEMPLATES.find((t) => t.id === id);
