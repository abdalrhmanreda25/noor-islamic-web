"use client";

import { BookOpen, HandHeart, Lightbulb, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { ContentCard, useCounters } from "@/components/ruqyah/content-card";
import type { NightPrayerContent } from "@/lib/data/night-prayer";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "virtues", icon: Star },
  { id: "howTo", icon: BookOpen },
  { id: "duas", icon: HandHeart },
  { id: "helps", icon: Lightbulb },
] as const;

/** Virtues / how-to / duas / practical helps, as in NightPlayersScreens. */
export function NightContent({ content }: { content: NightPrayerContent }) {
  const t = useTranslations("night-prayer");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("virtues");
  const counters = useCounters();

  return (
    <section>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition",
              tab === id ? "border-brand bg-brand text-white" : "bg-card text-brand hover:border-brand/50",
            )}
          >
            <Icon className="size-4" /> {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      {tab === "helps" ? (
        <ol className="space-y-2.5" dir="rtl">
          {content.helps.map((h, i) => (
            <li key={h} className="flex gap-3 rounded-2xl border bg-card p-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                {toLocaleDigits(i + 1, "ar")}
              </span>
              <p className="leading-relaxed">{h}</p>
            </li>
          ))}
        </ol>
      ) : (
        <div className="space-y-4">
          {content[tab].map((item) => {
            const key = `${tab}:${item.title}`;
            const repeat = item.repeat ?? 1;
            return (
              <ContentCard
                key={key}
                item={{
                  title: item.title,
                  text: item.text,
                  verses: item.verses,
                  refAr: item.refAr,
                  footnotes: [item.note, item.source].filter((s): s is string => !!s),
                }}
                {...(repeat > 1 && {
                  repeat,
                  remaining: counters.left(key, repeat),
                  onCount: () => counters.count(key, repeat),
                  onReset: () => counters.reset(key),
                })}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
