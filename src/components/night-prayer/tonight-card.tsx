"use client";

import { Hourglass, MapPin, Moon, MoonStar, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useLocation, useNow } from "@/hooks/use-location";
import { computePrayerTimes, formatTime } from "@/lib/prayer";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;

/**
 * The night `now` belongs to (port of NightTimes.resolve): before today's
 * Fajr it began at yesterday's Maghrib, otherwise it is today's Maghrib to
 * tomorrow's Fajr.
 */
export function resolveNight(lat: number, lng: number, now: Date) {
  const today = computePrayerTimes(lat, lng, now);
  const startDay =
    now < today.times.fajr ? computePrayerTimes(lat, lng, new Date(now.getTime() - DAY)) : today;
  const fajr =
    now < today.times.fajr ? today.times.fajr : computePrayerTimes(lat, lng, new Date(now.getTime() + DAY)).times.fajr;
  const { maghrib, isha } = startDay.times;
  const length = fajr.getTime() - maghrib.getTime();
  const at = (ms: number) => new Date(maghrib.getTime() + ms);
  return {
    timeZone: today.timeZone,
    maghrib,
    isha,
    firstThird: at(length / 3),
    middle: at(length / 2),
    lastThird: at((2 * length) / 3),
    fajr,
    length,
  };
}

/** Night-sky card: tonight's thirds, midnight, last third and a live status line. */
export function TonightCard() {
  const t = useTranslations("night-prayer");
  const locale = useLocale();
  const loc = useLocation();
  const now = useNow(30_000);
  const night = now ? resolveNight(loc.latitude, loc.longitude, now) : null;
  const fmt = (d: Date) => (night ? formatTime(d, locale, night.timeZone) : "--:--");

  const span = (ms: number) => {
    const mins = Math.max(0, Math.round(ms / 60_000));
    return t("span", { h: Math.floor(mins / 60), m: mins % 60 });
  };

  let status: { icon: typeof Moon; text: string } | null = null;
  if (night && now) {
    if (now < night.isha) status = { icon: Moon, text: t("statusBeforeIsha", { time: fmt(night.isha) }) };
    else if (now < night.lastThird)
      status = { icon: Hourglass, text: t("statusUntilLastThird", { span: span(night.lastThird.getTime() - now.getTime()) }) };
    else status = { icon: Sparkles, text: t("statusInLastThird", { span: span(night.fajr.getTime() - now.getTime()) }) };
  }

  const cells = night
    ? ([
        ["maghrib", night.maghrib],
        ["isha", night.isha],
        ["firstThird", night.firstThird],
        ["middle", night.middle],
        ["lastThird", night.lastThird],
        ["fajr", night.fajr],
      ] as const)
    : [];
  const progress =
    night && now ? Math.min(1, Math.max(0, (now.getTime() - night.maghrib.getTime()) / night.length)) : 0;

  return (
    <section className="hero-gradient overflow-hidden rounded-2xl p-5 text-white shadow-xl shadow-primary/30 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MoonStar className="size-7 text-gold" />
          <h2 className="text-xl font-bold">{t("tonight")}</h2>
        </div>
        <button
          type="button"
          onClick={loc.request}
          className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white"
        >
          <MapPin className="size-3.5" />
          {loc.status === "locating" ? t("locating") : loc.isDefault ? t("defaultLocation") : t("myLocation")}
        </button>
      </div>

      <div className="mt-4 flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold">
        {status && <status.icon className="size-5 shrink-0 text-gold" />}
        <span suppressHydrationWarning>{status?.text ?? " "}</span>
      </div>

      {/* Maghrib → Fajr, split in thirds; the gold segment is the last third. */}
      <div className="relative mt-6 h-3 rounded-full bg-white/10" aria-hidden>
        <div className="absolute inset-y-0 end-0 w-1/3 rounded-e-full bg-gold/50" />
        <div className="absolute inset-y-0 start-1/3 w-px bg-white/30" />
        <div className="absolute inset-y-0 start-1/2 w-px bg-white/50" />
        {now && (
          <div
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gold rtl:translate-x-1/2"
            style={{ insetInlineStart: `${progress * 100}%` }}
          />
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(cells.length ? cells : (["maghrib", "isha", "firstThird", "middle", "lastThird", "fajr"] as const).map((k) => [k, null] as const)).map(
          ([key, time]) => (
            <div
              key={key}
              className={cn(
                "rounded-xl border border-white/10 bg-white/5 p-2.5 text-center",
                key === "lastThird" && "border-gold/60 bg-gold/15",
              )}
            >
              <p className={cn("text-xs leading-tight text-white/70", key === "lastThird" && "text-gold")}>{t(`times.${key}`)}</p>
              <p className={cn("mt-1 text-sm font-bold tabular-nums", key === "lastThird" && "text-gold")} suppressHydrationWarning>
                {time ? fmt(time) : "--:--"}
              </p>
            </div>
          ),
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/60">{t("timesNote")}</p>
    </section>
  );
}
