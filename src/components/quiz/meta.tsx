import { createElement } from "react";
import {
  BadgeCheck,
  BookMarked,
  BookOpen,
  CalendarDays,
  HelpCircle,
  Landmark,
  MoonStar,
  Quote,
  RotateCcw,
  Scale,
  Shuffle,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { QuizCategoryId } from "@/lib/data/quiz";
import type { QuizMode } from "./session";

/** Mirrors quiz_category_icon.dart. */
export const CATEGORY_ICONS: Record<QuizCategoryId, LucideIcon> = {
  quran: BookOpen,
  messenger: MoonStar,
  caliphs: Landmark,
  sahaba: Users,
  prophets: BookMarked,
  fiqh: Scale,
  aqeedah: BadgeCheck,
  hadith: Quote,
};

export const modeIcon = (mode: QuizMode, category?: QuizCategoryId): LucideIcon =>
  mode === "daily"
    ? CalendarDays
    : mode === "mixed"
      ? Shuffle
      : mode === "review"
        ? RotateCcw
        : category
          ? CATEGORY_ICONS[category]
          : HelpCircle;

export function QuizModeIcon({
  mode,
  category,
  className,
}: {
  mode: QuizMode;
  category?: QuizCategoryId;
  className?: string;
}) {
  return createElement(modeIcon(mode, category), { className });
}
