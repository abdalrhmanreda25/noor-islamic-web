// Single registry of every feature: drives the home grid, header menu and
// section grouping (same order as the Flutter app's kSectionOrder).
// Titles live in messages/<locale>/features.json under the same id.
import {
  AudioLines,
  Award,
  BookOpen,
  BookText,
  CalendarCheck,
  CalendarDays,
  CalendarHeart,
  Clock,
  Coins,
  Compass,
  Fingerprint,
  Footprints,
  GitCompare,
  GraduationCap,
  HandHeart,
  Headphones,
  Hourglass,
  Image,
  Landmark,
  Library,
  ListChecks,
  Mic,
  Moon,
  MoonStar,
  NotebookPen,
  Radio,
  Scroll,
  ScrollText,
  Settings,
  Shield,
  ShieldPlus,
  Sparkle,
  Sparkles,
  Sun,
  Target,
  Trophy,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export const SECTIONS = ["quran", "prayer", "azkar", "hadith", "knowledge", "zakat", "ramadan", "calendar", "habits", "other"] as const;
export type SectionId = (typeof SECTIONS)[number];

export type Feature = { id: string; href: string; icon: LucideIcon; section: SectionId };

export const FEATURES = [
  { id: "quran", href: "/quran", icon: BookOpen, section: "quran" },
  { id: "quran-listen", href: "/quran/listen", icon: AudioLines, section: "quran" },
  { id: "reciters", href: "/reciters", icon: Mic, section: "quran" },
  { id: "radio", href: "/radio", icon: Radio, section: "quran" },
  { id: "khatma", href: "/khatma", icon: Target, section: "quran" },
  { id: "tafseer", href: "/tafseer", icon: BookText, section: "quran" },
  { id: "card-maker", href: "/card-maker", icon: Image, section: "quran" },
  { id: "asbab-nuzul", href: "/asbab-nuzul", icon: Scroll, section: "quran" },
  { id: "mutashabihat", href: "/mutashabihat", icon: GitCompare, section: "quran" },
  { id: "listening-wird", href: "/listening-wird", icon: Headphones, section: "quran" },
  { id: "prayer-times", href: "/prayer-times", icon: Clock, section: "prayer" },
  { id: "qibla", href: "/qibla", icon: Compass, section: "prayer" },
  { id: "night-prayer", href: "/night-prayer", icon: MoonStar, section: "prayer" },
  { id: "prayer-tracker", href: "/prayer-tracker", icon: CalendarCheck, section: "prayer" },
  { id: "salah-guide", href: "/salah-guide", icon: Footprints, section: "prayer" },
  { id: "doaa", href: "/doaa", icon: HandHeart, section: "azkar" },
  { id: "azkar", href: "/azkar", icon: Sun, section: "azkar" },
  { id: "tasbeeh", href: "/tasbeeh", icon: Fingerprint, section: "azkar" },
  { id: "azkar-tracker", href: "/azkar-tracker", icon: ListChecks, section: "azkar" },
  { id: "muslim-fortress", href: "/muslim-fortress", icon: Shield, section: "azkar" },
  { id: "ruqyah", href: "/ruqyah", icon: ShieldPlus, section: "azkar" },
  { id: "hadith", href: "/hadith", icon: Library, section: "hadith" },
  { id: "sunan", href: "/sunan", icon: Sparkle, section: "hadith" },
  { id: "seerah", href: "/seerah", icon: Landmark, section: "knowledge" },
  { id: "fiqh", href: "/fiqh", icon: GraduationCap, section: "knowledge" },
  { id: "names-of-allah", href: "/names-of-allah", icon: Sparkles, section: "knowledge" },
  { id: "nawawi", href: "/nawawi", icon: ScrollText, section: "knowledge" },
  { id: "quiz", href: "/quiz", icon: Trophy, section: "knowledge" },
  { id: "zakat", href: "/zakat", icon: Coins, section: "zakat" },
  { id: "ramadan", href: "/ramadan", icon: Moon, section: "ramadan" },
  { id: "fasting-tracker", href: "/fasting-tracker", icon: UtensilsCrossed, section: "ramadan" },
  { id: "hijri", href: "/hijri", icon: CalendarDays, section: "calendar" },
  { id: "achievements", href: "/achievements", icon: Award, section: "habits" },
  { id: "day-counter", href: "/day-counter", icon: Hourglass, section: "habits" },
  { id: "daily-planner", href: "/daily-planner", icon: NotebookPen, section: "habits" },
  { id: "daily-content", href: "/daily-content", icon: CalendarHeart, section: "habits" },
  { id: "settings", href: "/settings", icon: Settings, section: "other" },
] as const satisfies readonly Feature[];

export type FeatureId = (typeof FEATURES)[number]["id"];

export const featuresBySection = () =>
  SECTIONS.map((section) => ({
    section,
    features: FEATURES.filter((f) => f.section === section),
  }));

/** Shown directly in the desktop header; everything else is in the menu. */
export const PRIMARY_NAV: FeatureId[] = ["quran", "prayer-times", "azkar", "hadith", "qibla"];
