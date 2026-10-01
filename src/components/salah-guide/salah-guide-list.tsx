"use client";

import { BookOpen, CircleCheck, CloudRain, Droplets, Footprints, Luggage, Moon, Search, Signpost, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { SalahGuide } from "@/lib/data/salah-guide";
import { cn } from "@/lib/utils";

export const SALAH_READ_KEY = "yusr.salah-guide.read";

/** Icon per category id (salah_category_icon.dart). */
export const CATEGORY_ICON: Record<string, typeof BookOpen> = {
  tahara: Droplets,
  "how-to-pray": Footprints,
  "sunan-nawafil": Moon,
  "special-prayers": Users,
  istikhara: Signpost,
  "travel-prayer": Luggage,
  "eclipse-rain": CloudRain,
};

/** Strips Arabic diacritics and unifies letter forms for search. */
const norm = (s: string) =>
  s
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase();

/** Port of SalahGuideScreen: progress, search, category chips and an unread filter. */
export function SalahGuideList({ guide }: { guide: SalahGuide }) {
  const t = useTranslations("salah-guide");
  const locale = useLocale();
  const [read] = useLocalStorage<string[]>(SALAH_READ_KEY, []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const n = (v: number) => toLocaleDigits(v, locale);

  const all = guide.categories.flatMap((c) => c.topics);
  const readSet = new Set(read);
  const readCount = all.filter((tp) => readSet.has(tp.id)).length;
  const q = norm(query.trim());

  const sections = guide.categories
    .filter((c) => !category || c.id === category)
    .map((c) => ({
      ...c,
      topics: c.topics.filter(
        (tp) =>
          (!unreadOnly || !readSet.has(tp.id)) &&
          (!q || norm(`${tp.question} ${tp.intro} ${tp.blocks.map((b) => b.text).join(" ")}`).includes(q)),
      ),
    }))
    .filter((c) => c.topics.length);

  return (
    <div className="space-y-5">
      <section className="hero-gradient rounded-2xl p-5 text-white sm:p-7">
        <p className="leading-relaxed text-white/85" dir="rtl">
          {guide.subtitle}
        </p>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full bg-gold transition-all" style={{ width: `${(readCount / all.length) * 100}%` }} />
          </div>
          <span className="text-sm text-white/80">
            {readCount === all.length ? t("allRead") : t("readProgress", { read: n(readCount), total: n(all.length) })}
          </span>
        </div>
      </section>

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-11 rounded-xl bg-card ps-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={category === null} onClick={() => setCategory(null)}>
          {t("all")}
        </Chip>
        {guide.categories.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.title}
          </Chip>
        ))}
        <Chip active={unreadOnly} onClick={() => setUnreadOnly((u) => !u)}>
          {t("unread")} ({n(all.length - readCount)})
        </Chip>
      </div>

      {sections.length === 0 ? (
        <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          {unreadOnly && !q ? t("noUnread") : t("noResults")}
        </p>
      ) : (
        sections.map((c) => {
          const Icon = CATEGORY_ICON[c.id] ?? BookOpen;
          return (
            <section key={c.id}>
              <div className="mb-3 flex items-center gap-3" dir="rtl">
                <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">{c.title}</h2>
                  <p className="text-sm text-muted-foreground">{c.subtitle}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {c.topics.map((tp) => (
                  <Link
                    key={tp.id}
                    href={`/salah-guide/${tp.id}`}
                    dir="rtl"
                    className="group rounded-2xl border bg-card p-5 transition hover:border-brand/50 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold leading-relaxed">{tp.question}</p>
                      {readSet.has(tp.id) && <CircleCheck className="size-5 shrink-0 text-brand" />}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{tp.intro}</p>
                    {tp.steps && (
                      <span className="mt-3 inline-block rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                        {t("stepByStep")}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition",
        active ? "border-brand bg-brand text-white" : "bg-card hover:border-brand/50",
      )}
    >
      {children}
    </button>
  );
}
