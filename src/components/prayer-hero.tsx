"use client";

import { MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocation, useNow } from "@/hooks/use-location";
import { computePrayerTimes, formatDuration, formatTime, nextPrayer, PRAYERS } from "@/lib/prayer";
import { cn } from "@/lib/utils";

/** Home-screen prayer card, mirroring the Flutter HomePrayerCard. */
export function PrayerHero() {
  const t = useTranslations("prayer");
  const locale = useLocale();
  const loc = useLocation();
  const now = useNow();

  const { times, timeZone } = computePrayerTimes(loc.latitude, loc.longitude, now ?? undefined);
  const next = now ? nextPrayer(loc.latitude, loc.longitude, now) : null;

  return (
    <section className="hero-gradient relative overflow-hidden rounded-2xl p-5 text-white shadow-xl shadow-primary/30 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/70">{t("next")}</p>
          <p className="mt-1 text-3xl font-bold text-gold sm:text-4xl">
            {next ? t(next.name) : "—"}
          </p>
          <p className="mt-1 text-lg tabular-nums">
            {next ? formatTime(next.time, locale, timeZone) : " "}
          </p>
        </div>
        <div className="text-end">
          <p className="rounded-full bg-white/10 px-3 py-1 text-sm tabular-nums" suppressHydrationWarning>
            {next && now ? t("remaining", { time: formatDuration(next.time.getTime() - now.getTime(), locale) }) : " "}
          </p>
          <button
            onClick={loc.request}
            className="mt-2 inline-flex items-center gap-1 text-xs text-white/70 hover:text-white"
          >
            <MapPin className="size-3.5" />
            {loc.status === "locating"
              ? t("locating")
              : loc.isDefault
                ? t("defaultLocation")
                : t("myLocation")}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PRAYERS.map((p) => (
          <div
            key={p}
            className={cn(
              "rounded-xl border border-white/10 bg-white/5 p-2.5 text-center",
              next?.name === p && "border-gold/60 bg-gold/15",
            )}
          >
            <p className="text-xs text-white/70">{t(p)}</p>
            <p className="mt-1 text-sm font-medium tabular-nums" suppressHydrationWarning>
              {now ? formatTime(times[p], locale, timeZone) : "--:--"}
            </p>
          </div>
        ))}
      </div>

      <Link href="/prayer-times" className="mt-4 inline-block text-sm text-gold hover:underline">
        {t("viewAll")}
      </Link>
    </section>
  );
}
