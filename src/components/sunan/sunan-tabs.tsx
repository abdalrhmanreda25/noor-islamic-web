"use client";

import { ChevronLeft, ChevronRight, Landmark, MoonStar, Sparkles, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { SunanData, SunanTab } from "@/lib/data/sunan";
import { cn } from "@/lib/utils";
import { SunnahCard } from "./sunnah-card";

const SUNAN_TABS: SunanTab[] = ["rawatib", "nawafil", "daily", "divine"];
const ICONS = { rawatib: Landmark, nawafil: MoonStar, daily: Sun, divine: Sparkles } as const;

export function SunanTabs({ tabs }: { tabs: SunanData["tabs"] }) {
  const t = useTranslations("sunan");
  const locale = useLocale();
  const [tab, setTab] = useState<SunanTab>("rawatib");
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <section className="mt-8">
      <div role="tablist" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {SUNAN_TABS.map((id) => {
          const Icon = ICONS[id];
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition hover:border-brand/50",
                tab === id ? "border-primary bg-primary text-primary-foreground" : "bg-card",
              )}
            >
              <Icon className="size-4" />
              {t(`tabs.${id}`)}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-5 space-y-6">
        {tabs[tab].map((group, gi) => (
          <div key={`${tab}-${gi}`}>
            {group.title && (
              <h2 dir="rtl" className="mb-3 flex items-center gap-2 text-lg font-bold text-brand">
                <span className="h-5 w-1 rounded-full bg-gold" />
                {group.title}
              </h2>
            )}
            <div className="grid gap-3 lg:grid-cols-2">
              {group.items.map((item) => (
                <SunnahCard key={item.title} item={item} />
              ))}
            </div>
          </div>
        ))}
        {tab === "nawafil" && (
          <Link
            href="/night-prayer"
            className="flex items-center gap-4 rounded-2xl border bg-card p-5 transition hover:border-brand/50"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-brand">
              <MoonStar className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{t("nightPrayer")}</p>
              <p className="text-sm text-muted-foreground">{t("nightPrayerDesc")}</p>
            </div>
            <Chevron className="size-5 text-muted-foreground" />
          </Link>
        )}
      </div>
    </section>
  );
}
