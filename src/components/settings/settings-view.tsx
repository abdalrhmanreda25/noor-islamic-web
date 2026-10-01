"use client";

import { BookOpen, Check, Clock, Copy, Info, Languages, Mail, Minus, Monitor, Moon, Plus, RotateCcw, Shield, Sun } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, useNow } from "@/hooks/use-location";
import { Link, usePathname } from "@/i18n/navigation";
import type { Reciter } from "@/lib/data";
import {
  computePrayerTimes,
  formatTime,
  MAX_ADJUSTMENT,
  METHODS,
  PRAYER_SETTINGS_KEY,
  PRAYERS,
  readPrayerSettings,
  regionTimezone,
  type MethodName,
  type PrayerName,
  type PrayerSettings,
} from "@/lib/prayer";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";
const THEME_KEY = "yusr.theme";
const RECITER_KEY = "yusr.reciter";
const DEFAULT_RECITER = "123-123";
const ZERO = Object.fromEntries(PRAYERS.map((p) => [p, 0])) as Record<PrayerName, number>;

const DEVELOPERS = [
  { id: "abdalrhman", image: "/images/developer_abdalrhman.jpg", linkedin: "https://www.linkedin.com/in/abdalrhman-reda-b24a11226/" },
  { id: "eslam", image: "/images/developer_eslam.png", linkedin: "https://www.linkedin.com/in/eslamaped/" },
  { id: "mohammed", image: "/images/developer_mohammed.jpg", linkedin: "https://www.linkedin.com/in/mohammedrageh/?locale=en" },
] as const;
const SUPPORT_EMAILS = ["mohammedragehzxz@gmail.com", "abdalrahmanreda4@gmail.com", "eslam.aped@proton.me"];

/**
 * "system" is stored as no key at all, so the inline theme script in the
 * locale layout (which only knows "light" | "dark" | missing) keeps working.
 */
function applyTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {}
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <span className="text-brand">{icon}</span>
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="font-medium">{title}</p>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function SettingsView({ reciters }: { reciters: Reciter[] }) {
  const t = useTranslations("settings");
  const tp = useTranslations("prayer");
  const locale = useLocale();
  const pathname = usePathname();
  const n = (x: number) => toLocaleDigits(x, locale);
  const loc = useLocation(false);
  const now = useNow(60_000);
  const [theme, setTheme] = useState<Theme>("system");
  const [reciter, setReciter] = useState(DEFAULT_RECITER);
  const [query, setQuery] = useState("");
  const [prayer, setPrayer] = useState<PrayerSettings>({ adjustments: ZERO, method: "auto" });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      const th = localStorage.getItem(THEME_KEY);
      // Hydrating from browser-only storage after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(th === "light" || th === "dark" ? th : "system");
      setReciter(localStorage.getItem(RECITER_KEY) ?? DEFAULT_RECITER);
    } catch {}
    const saved = readPrayerSettings();
    if (saved) setPrayer({ adjustments: { ...ZERO, ...saved.adjustments }, method: saved.method ?? "auto" });
  }, []);

  // Keep following the OS while on "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const savePrayer = (next: PrayerSettings) => {
    setPrayer(next);
    try {
      localStorage.setItem(PRAYER_SETTINGS_KEY, JSON.stringify(next));
    } catch {}
  };
  const adjust = (p: PrayerName, delta: number) =>
    savePrayer({
      ...prayer,
      adjustments: { ...prayer.adjustments, [p]: Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, (prayer.adjustments[p] ?? 0) + delta)) },
    });

  const regionTz = regionTimezone(loc.latitude, loc.longitude);
  const autoMethod = computePrayerTimes(loc.latitude, loc.longitude, now ?? undefined, { adjustments: ZERO, method: "auto" }).method;
  const base = now ? computePrayerTimes(loc.latitude, loc.longitude, now, { adjustments: ZERO, method: prayer.method }) : null;
  const adjusted = now ? computePrayerTimes(loc.latitude, loc.longitude, now, prayer) : null;
  const tz = base?.timeZone ?? regionTz ?? "UTC";

  const current = reciters.find((r) => r.id === reciter);
  const filtered = useMemo(() => {
    const q = query.trim();
    return q ? reciters.filter((r) => r.name.includes(q) || r.moshaf.includes(q)) : reciters;
  }, [query, reciters]);

  const fmtOffset = (m: number) => (m === 0 ? n(0) : `⁦${m > 0 ? "+" : "−"}${n(Math.abs(m))}⁩`);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Section title={t("appearance")} icon={<Sun className="size-5" />}>
          <Row title={t("theme")} desc={t("themeDesc")}>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["light", Sun],
                  ["dark", Moon],
                  ["system", Monitor],
                ] as const
              ).map(([id, Icon]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={theme === id}
                  onClick={() => {
                    setTheme(id);
                    applyTheme(id);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition hover:border-brand/50",
                    theme === id && "border-brand bg-secondary font-bold",
                  )}
                >
                  <Icon className="size-5" />
                  {t(`themes.${id}`)}
                </button>
              ))}
            </div>
          </Row>
          <Row title={t("language")} desc={t("languageDesc")}>
            <div className="grid grid-cols-2 gap-2">
              {(["ar", "en"] as const).map((l) => (
                <Link
                  key={l}
                  href={pathname}
                  locale={l}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm transition hover:border-brand/50",
                    locale === l && "border-brand bg-secondary font-bold",
                  )}
                >
                  <Languages className="size-4" />
                  {t(`languages.${l}`)}
                  {locale === l && <Check className="size-4 text-brand" />}
                </Link>
              ))}
            </div>
          </Row>
        </Section>

        <Section title={t("quran")} icon={<BookOpen className="size-5" />}>
          <Row title={t("reciter")} desc={t("reciterDesc")}>
            {current && (
              <p className="rounded-xl bg-secondary p-3 text-sm">
                <span className="font-bold">{current.name}</span>
                <span className="block text-xs text-muted-foreground">{current.moshaf}</span>
              </p>
            )}
            <Input placeholder={t("searchReciter")} value={query} onChange={(e) => setQuery(e.target.value)} />
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border p-1" dir="rtl">
              {filtered.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setReciter(r.id);
                      try {
                        localStorage.setItem(RECITER_KEY, r.id);
                      } catch {}
                    }}
                    className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-secondary", r.id === reciter && "bg-secondary font-bold")}
                  >
                    <span className="min-w-0 flex-1">
                      {r.name}
                      <span className="block text-xs font-normal text-muted-foreground">{r.moshaf}</span>
                    </span>
                    {r.id === reciter && <Check className="size-4 text-brand" />}
                  </button>
                </li>
              ))}
            </ul>
          </Row>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title={t("prayer")} icon={<Clock className="size-5" />}>
          <Row title={t("method")} desc={t("methodDesc")}>
            <select
              className="h-9 w-full rounded-lg border bg-transparent px-2 text-sm dark:bg-input/30"
              value={prayer.method ?? "auto"}
              onChange={(e) => savePrayer({ ...prayer, method: e.target.value as MethodName | "auto" })}
            >
              <option value="auto" className="bg-popover">
                {t("methodAuto", { method: tp(`methods.${autoMethod}`) })}
              </option>
              {METHODS.map((m) => (
                <option key={m} value={m} className="bg-popover">
                  {tp(`methods.${m}`)}
                </option>
              ))}
            </select>
          </Row>
          <Row title={t("adjust")} desc={t("adjustDesc")}>
            <div className="space-y-2">
              {PRAYERS.map((p) => {
                const m = prayer.adjustments[p] ?? 0;
                return (
                  <div key={p} className="flex items-center gap-2 rounded-xl border p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{tp(p)}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {base ? t("calculated", { time: formatTime(base.times[p], locale, tz) }) : " "}
                        {adjusted && m !== 0 && <span className="ms-2 text-brand">{t("adjusted", { time: formatTime(adjusted.times[p], locale, tz) })}</span>}
                      </p>
                    </div>
                    <Button variant="outline" size="icon-sm" onClick={() => adjust(p, -1)} disabled={m <= -MAX_ADJUSTMENT} aria-label={t("earlier")}>
                      <Minus />
                    </Button>
                    <span className={cn("w-14 text-center text-sm font-bold tabular-nums", m !== 0 && "text-brand")}>{t("minutes", { n: fmtOffset(m) })}</span>
                    <Button variant="outline" size="icon-sm" onClick={() => adjust(p, 1)} disabled={m >= MAX_ADJUSTMENT} aria-label={t("later")}>
                      <Plus />
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{t("adjustMax", { max: n(MAX_ADJUSTMENT) })}</p>
              <Button variant="outline" size="sm" onClick={() => savePrayer({ ...prayer, adjustments: ZERO })}>
                <RotateCcw />
                {t("reset")}
              </Button>
            </div>
          </Row>
        </Section>

        <Section title={t("about")} icon={<Info className="size-5" />}>
          <div className="hero-gradient flex items-center gap-4 rounded-2xl p-4 text-white">
            <Image src="/yusr-logo.png" alt="" width={56} height={56} className="size-14 rounded-xl bg-white/10 p-1" />
            <div>
              <p className="text-xl font-bold text-gold">{t("appName")}</p>
              <p className="text-sm leading-6 text-white/85">{t("appDesc")}</p>
            </div>
          </div>
          <Row title={t("team")}>
            <div className="space-y-2">
              {DEVELOPERS.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <Image src={d.image} alt={t(`developers.${d.id}`)} width={56} height={56} className="size-14 rounded-full object-cover ring-2 ring-gold/60" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{t(`developers.${d.id}`)}</p>
                    <p className="text-xs text-muted-foreground">{t("role")}</p>
                  </div>
                  <Button variant="outline" size="sm" nativeButton={false} render={<a href={d.linkedin} target="_blank" rel="noopener noreferrer" />}>
                    {t("linkedin")}
                  </Button>
                </div>
              ))}
            </div>
          </Row>
          <Row title={t("support")}>
            <div className="space-y-2">
              {SUPPORT_EMAILS.map((email) => (
                <div key={email} className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm">
                  <Mail className="size-4 text-brand" />
                  <a href={`mailto:${email}`} className="min-w-0 flex-1 truncate hover:underline" dir="ltr">
                    {email}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("copyEmail")}
                    onClick={() => {
                      navigator.clipboard?.writeText(email).then(() => {
                        setCopied(email);
                        setTimeout(() => setCopied(null), 2000);
                      });
                    }}
                  >
                    {copied === email ? <Check className="text-brand" /> : <Copy />}
                  </Button>
                </div>
              ))}
            </div>
          </Row>
          <Row title={t("privacy")}>
            <p className="flex gap-2 text-sm leading-6 text-muted-foreground">
              <Shield className="mt-1 size-4 shrink-0 text-brand" />
              {t("privacyText")}
            </p>
          </Row>
        </Section>
      </div>
    </div>
  );
}
