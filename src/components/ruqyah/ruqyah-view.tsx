"use client";

import { BookOpen, ChevronDown, HandHeart, Lightbulb, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import type { RuqyahContent, RuqyahTopic } from "@/lib/data/ruqyah";
import { cn } from "@/lib/utils";
import { ContentCard, useCounters } from "./content-card";

const RUQYAH_TOPICS: RuqyahTopic[] = ["all", "protection", "eye", "magic", "healing"];

/** Port of RookiaScreen: guide, Quran / Sunnah toggle, topic chips, counters. */
export function RuqyahView({ content }: { content: RuqyahContent }) {
  const t = useTranslations("ruqyah");
  const locale = useLocale();
  const [quran, setQuran] = useState(true);
  const [topic, setTopic] = useState<RuqyahTopic>("all");
  const [guideOpen, setGuideOpen] = useState(true);
  const counters = useCounters();

  const source = quran ? content.quran : content.duas;
  const topics = RUQYAH_TOPICS.filter((tp) => tp === "all" || source.some((i) => i.topics.includes(tp)));
  const items = topic === "all" ? source : source.filter((i) => i.topics.includes(topic));
  const key = (title: string) => `${quran ? "q" : "d"}:${title}`;
  const done = items.filter((i) => counters.left(key(i.title), i.repeat ?? 1) === 0).length;

  return (
    <div className="space-y-5">
      <section className="hero-gradient rounded-2xl p-5 text-white">
        <button
          type="button"
          onClick={() => setGuideOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 text-start"
        >
          <span className="flex items-center gap-2 text-lg font-bold">
            <Lightbulb className="size-5 text-gold" /> {t("guideTitle")}
          </span>
          <ChevronDown className={cn("size-5 transition", guideOpen && "rotate-180")} />
        </button>
        {guideOpen && (
          <ol className="mt-4 space-y-2" dir="rtl">
            {content.guide.map((g, i) => (
              <li key={g} className="flex gap-3 text-sm leading-relaxed text-white/90">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                  {toLocaleDigits(i + 1, "ar")}
                </span>
                {g}
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="grid grid-cols-2 gap-1 rounded-2xl border bg-card p-1">
        {[
          { on: true, icon: BookOpen, label: t("quran") },
          { on: false, icon: HandHeart, label: t("sunnah") },
        ].map(({ on, icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setQuran(on);
              setTopic("all");
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition",
              quran === on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {topics.map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => setTopic(tp)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              topic === tp ? "border-brand bg-brand text-white" : "bg-card hover:border-brand/50",
            )}
          >
            {t(`topics.${tp}`)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-brand transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums">
          {done === items.length
            ? t("allDone")
            : t("progress", { done: toLocaleDigits(done, locale), total: toLocaleDigits(items.length, locale) })}
        </span>
        <button
          type="button"
          onClick={counters.resetAll}
          disabled={Object.keys(counters.remaining).length === 0}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <RotateCcw className="size-4" /> {t("reset")}
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const k = key(item.title);
          const repeat = item.repeat ?? 1;
          return (
            <ContentCard
              key={k}
              item={{
                title: item.title,
                text: item.text,
                verses: item.verses,
                refAr: item.refAr,
                footnotes: [item.benefit, ...(item.source ? [item.source] : [])],
              }}
              repeat={repeat}
              remaining={counters.left(k, repeat)}
              onCount={() => counters.count(k, repeat)}
              onReset={() => counters.reset(k)}
            />
          );
        })}
      </div>
    </div>
  );
}
