"use client";

import { LocateFixed } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useLocation, useNow } from "@/hooks/use-location";
import { computePrayerTimes, formatDuration, formatTime, nextPrayer, PRAYERS } from "@/lib/prayer";
import { cn } from "@/lib/utils";

export function PrayerTimesView() {
  const t = useTranslations("prayer");
  const locale = useLocale();
  const loc = useLocation(true);
  const now = useNow();

  const { times, timeZone, method } = computePrayerTimes(loc.latitude, loc.longitude, now ?? undefined);
  const next = now ? nextPrayer(loc.latitude, loc.longitude, now) : null;
  const dateLabel = now
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "full", timeZone }).format(now)
    : "";
  const hijri = now
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-islamic-umalqura" : "en-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone,
      }).format(now)
    : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-3">
        {PRAYERS.map((p) => {
          const active = next?.name === p;
          return (
            <div
              key={p}
              className={cn(
                "flex items-center justify-between rounded-xl border bg-card px-5 py-4",
                active && "border-transparent bg-primary text-primary-foreground shadow-lg",
              )}
            >
              <span className="text-lg font-bold">{t(p)}</span>
              <span className={cn("text-lg tabular-nums", active && "text-gold")}>
                {now ? formatTime(times[p], locale, timeZone) : "--:--"}
              </span>
            </div>
          );
        })}
      </div>

      <aside className="space-y-4">
        <div className="hero-gradient rounded-2xl p-5 text-white">
          <p className="text-sm text-white/70">{t("next")}</p>
          <p className="mt-1 text-3xl font-bold text-gold">{next ? t(next.name) : "—"}</p>
          <p className="mt-2 text-2xl tabular-nums">
            {next && now ? formatDuration(next.time.getTime() - now.getTime(), locale) : " "}
          </p>
          <p className="mt-4 text-sm text-white/80">{dateLabel}</p>
          <p className="text-sm text-white/80">{hijri}</p>
        </div>
        <div className="space-y-3 rounded-2xl border bg-card p-5 text-sm">
          <p className="font-medium">
            {loc.isDefault ? t("defaultLocation") : t("myLocation")}
            {!loc.isDefault && (
              <span className="block text-xs text-muted-foreground tabular-nums" dir="ltr">
                {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} · {timeZone}
              </span>
            )}
          </p>
          {loc.status === "denied" && <p className="text-destructive">{t("locationDenied")}</p>}
          <p className="text-muted-foreground">
            {t("method")}: {now ? t(`methods.${method}`) : "…"}
          </p>
          <Button onClick={loc.request} disabled={loc.status === "locating"} className="w-full">
            <LocateFixed />
            {loc.status === "locating" ? t("locating") : t("useLocation")}
          </Button>
        </div>
      </aside>
    </div>
  );
}
