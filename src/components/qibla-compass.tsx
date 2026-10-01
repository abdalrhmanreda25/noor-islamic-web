"use client";

/* eslint-disable @next/next/no-img-element */
import { Compass, Infinity as Figure8, LocateFixed, MapPin, Smartphone, Magnet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toLocaleDigits } from "@/components/page-header";
import { useLocation } from "@/hooks/use-location";
import { distanceToKaabaKm, qiblaBearing } from "@/lib/prayer";
import { cn } from "@/lib/utils";

type OrientationEventWithCompass = DeviceOrientationEvent & { webkitCompassHeading?: number };
type OrientationPermission = { requestPermission?: () => Promise<"granted" | "denied"> };

const CARDINALS = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;

/** Port of the app's QiblaScreen: compass dial with live heading, bearing, distance and tips. */
export function QiblaCompass() {
  const t = useTranslations("qibla");
  const tp = useTranslations("prayer");
  const locale = useLocale();
  const loc = useLocation(true);
  const [heading, setHeading] = useState<number | null>(null);
  const [compass, setCompass] = useState<"off" | "on" | "unsupported">("off");

  const bearing = qiblaBearing(loc.latitude, loc.longitude);
  const km = distanceToKaabaKm(loc.latitude, loc.longitude);
  const cardinal = (deg: number) => t(`cardinal.${CARDINALS[Math.round(deg / 45) % 8]}`);

  useEffect(() => {
    if (compass !== "on") return;
    const onOrient = (e: Event) => {
      const ev = e as OrientationEventWithCompass;
      // iOS exposes a true compass heading; elsewhere use absolute alpha.
      if (ev.webkitCompassHeading != null) setHeading(ev.webkitCompassHeading);
      else if (ev.absolute && ev.alpha != null) setHeading(360 - ev.alpha);
    };
    window.addEventListener("deviceorientationabsolute", onOrient);
    window.addEventListener("deviceorientation", onOrient);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrient);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [compass]);

  const enableCompass = async () => {
    if (typeof DeviceOrientationEvent === "undefined") return setCompass("unsupported");
    const req = (DeviceOrientationEvent as unknown as OrientationPermission).requestPermission;
    if (req && (await req().catch(() => "denied")) !== "granted") return setCompass("unsupported");
    setCompass("on");
  };

  // Without a live heading, the dial is drawn north-up.
  const dialRotation = heading == null ? 0 : -heading;
  const offset = heading == null ? null : ((bearing - heading + 540) % 360) - 180;
  const aligned = offset != null && Math.abs(offset) < 5;
  const letters = locale === "ar" ? ["ش", "ق", "ج", "غ"] : ["N", "E", "S", "W"];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col items-center rounded-2xl border bg-card p-6">
        <div
          className={cn(
            "relative size-72 rounded-full border-8 bg-secondary/40 transition sm:size-80",
            aligned ? "border-brand shadow-[0_0_40px] shadow-brand/40" : "border-muted",
          )}
        >
          <div className="absolute inset-0 transition-transform duration-200" style={{ transform: `rotate(${dialRotation}deg)` }}>
            {Array.from({ length: 72 }, (_, i) => (
              <span key={i} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${i * 5}deg)` }}>
                <span className={cn("w-px bg-muted-foreground/40", i % 6 === 0 ? "h-3" : "h-1.5")} />
              </span>
            ))}
            {letters.map((d, i) => (
              <span
                key={d}
                className={cn("absolute inset-0 flex justify-center pt-4 text-sm font-bold", i === 0 ? "text-destructive" : "text-muted-foreground")}
                style={{ transform: `rotate(${i * 90}deg)` }}
              >
                {d}
              </span>
            ))}
            <div className="absolute inset-0" style={{ transform: `rotate(${bearing}deg)` }}>
              <div className="absolute start-1/2 top-12 h-[calc(50%-3rem)] w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-gold to-gold/10 rtl:translate-x-1/2" />
              <img
                src="/icons/kaaba.svg"
                alt={t("kaaba")}
                width={36}
                height={36}
                className="absolute start-1/2 top-2 size-9 -translate-x-1/2 rtl:translate-x-1/2"
              />
            </div>
          </div>
          {/* Fixed marker: the top of the device. */}
          <div className="absolute start-1/2 -top-3 size-0 -translate-x-1/2 border-x-8 border-t-[12px] border-x-transparent border-t-primary rtl:translate-x-1/2 dark:border-t-gold" />
          <div className="absolute inset-[44%] rounded-full bg-primary" />
        </div>

        <div className="mt-5 min-h-6 text-center">
          {aligned ? (
            <p className="font-bold text-brand">{t("aligned")}</p>
          ) : offset != null ? (
            <p className="text-sm font-medium">
              {offset > 0 ? t("turnRight", { deg: toLocaleDigits(Math.round(offset), locale) }) : t("turnLeft", { deg: toLocaleDigits(Math.round(-offset), locale) })}
            </p>
          ) : null}
        </div>
        {compass === "off" && (
          <Button className="mt-4" onClick={enableCompass}>
            <Compass /> {t("enableCompass")}
          </Button>
        )}
        <p className="mt-3 max-w-sm text-center text-sm text-muted-foreground">
          {compass === "unsupported" || (compass === "on" && heading == null) ? t("noCompass") : t("compassHint")}
        </p>
      </div>

      <aside className="space-y-4">
        <div className="hero-gradient rounded-2xl p-5 text-white">
          <p className="text-sm text-white/70">{t("bearing")}</p>
          <p className="mt-1 text-5xl font-bold text-gold tabular-nums">{toLocaleDigits(Math.round(bearing), locale)}°</p>
          <p className="mt-1 text-sm">{t("fromNorth", { deg: toLocaleDigits(bearing.toFixed(1), locale), dir: cardinal(bearing) })}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-xs text-white/70">{t("deviceHeading")}</p>
              <p className="mt-0.5 font-bold tabular-nums">{heading == null ? "—" : `${toLocaleDigits(Math.round(heading), locale)}°`}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-xs text-white/70">{t("distanceLabel")}</p>
              <p className="mt-0.5 font-bold">{t("km", { km: km.toLocaleString(locale === "ar" ? "ar-EG" : "en-US") })}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <p className="flex items-center gap-1.5 text-sm">
            <MapPin className="size-4 text-brand" />
            {loc.isDefault ? tp("defaultLocation") : tp("myLocation")}
          </p>
          {loc.status === "denied" && <p className="text-sm text-destructive">{tp("locationDenied")}</p>}
          <Button variant="outline" className="w-full" onClick={loc.request} disabled={loc.status === "locating"}>
            <LocateFixed /> {loc.status === "locating" ? tp("locating") : tp("useLocation")}
          </Button>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="mb-3 font-bold">{t("tipsTitle")}</p>
          <ul className="space-y-2.5 text-sm">
            {(
              [
                [Smartphone, "tipFlat"],
                [Magnet, "tipMetal"],
                [Figure8, "tipCalibrate"],
                [LocateFixed, "tipGps"],
              ] as const
            ).map(([Icon, key]) => (
              <li key={key} className="flex gap-2.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-gold" />
                <span className="text-muted-foreground">{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
