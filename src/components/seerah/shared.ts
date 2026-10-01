// Helpers shared by the Seerah server and client components (no fs here).
import { createElement } from "react";
import {
  Baby, BookOpen, Flag, Flower2, Globe, HandHeart, Handshake, Heart, House, Landmark,
  Lock, Megaphone, Moon, Mountain, Route, Shield, Sparkles, Sunrise, type LucideIcon,
} from "lucide-react";

/** Icons by JSON id, as in the app's seerah_icons.dart. */
const PART_ICONS: Record<string, LucideIcon> = {
  before: Sunrise, makkah: Mountain, madinah: Landmark, farewell: Heart, legacy: Sparkles,
};
const CHAPTER_ICONS: Record<string, LucideIcon> = {
  birth: Baby, best: Heart, revelation: BookOpen, secret: Lock, public: Megaphone,
  isra: Moon, hijra: Route, state: Landmark, battles: Shield, hudaybiyyah: Handshake,
  conquest: Flag, family: House, farewell: Flower2, miracles: Sparkles, shamail: HandHeart,
  legacy: Globe,
};
export const PartIcon = ({ id, className }: { id: string; className?: string }) =>
  createElement(PART_ICONS[id] ?? BookOpen, { className, "aria-hidden": true });
export const ChapterIcon = ({ id, className }: { id: string; className?: string }) =>
  createElement(CHAPTER_ICONS[id] ?? BookOpen, { className, "aria-hidden": true });

export const lessonHref = (l: { chapterId: string; slug: string }) => `/seerah/${l.chapterId}/${l.slug}`;

/** localStorage keys (yusr.seerah.*). */
export const KEYS = {
  read: "yusr.seerah.read",
  last: "yusr.seerah.last",
  fontScale: "yusr.seerah.fontScale",
} as const;

/** Accent colour of the app's SeerahPalette: dark green, gold in dark mode. */
export const ACCENT = "text-primary dark:text-gold";

/** Lesson summary passed to client components. */
export type LessonLink = { id: string; slug: string; title: string; minutes: number; chapterId: string; chapterTitle: string };

/** Folds Arabic spelling variants (tashkeel, hamza forms, ta marbuta…), as the app's search does. */
export const normalizeArabic = (s: string) =>
  s
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase();

/** ~120 characters of `text` around the first match of the normalized `term`. */
export function excerpt(text: string, term: string) {
  if (text.length <= 120) return text;
  const origin: number[] = [];
  let folded = "";
  for (let i = 0; i < text.length; i++) {
    const n = normalizeArabic(text[i]);
    folded += n;
    for (let k = 0; k < n.length; k++) origin.push(i);
  }
  const at = folded.indexOf(term);
  if (at < 0) return `${text.slice(0, 120)} …`;
  const start = Math.max(0, origin[at] - 50);
  const end = Math.min(text.length, start + 120);
  return `${start > 0 ? "… " : ""}${text.slice(start, end).trim()}${end < text.length ? " …" : ""}`;
}
