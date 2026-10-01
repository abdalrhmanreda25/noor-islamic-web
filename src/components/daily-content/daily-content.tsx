"use client";

import { BookOpen, CalendarDays, HandHeart, Quote, Sparkles, Star, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CopyShareButtons } from "@/components/hadith/copy-button";
import { hadithAnchor, hadithNo } from "@/components/hadith/hadith-card";
import { toLocaleDigits } from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Link } from "@/i18n/navigation";
import type { DailyAyah, DailyEntry, DailyHadith, DailyMeta } from "@/lib/data/daily-content";
import { cn } from "@/lib/utils";

type Kind = "ayah" | "hadith" | "dua" | "dhikr";
const KINDS: Kind[] = ["ayah", "hadith", "dua", "dhikr"];
const ICONS = { ayah: BookOpen, hadith: Quote, dua: HandHeart, dhikr: Sparkles } as const;
const STRIP_DAYS = 14;
const DAY = 86_400_000;

/** Whole days since 1970-01-01 in local time, as the app computes it. */
const dayNumberOf = (d: Date) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(1970, 0, 1).getTime()) / DAY);
const dateOf = (day: number) => {
  const d = new Date(1970, 0, 1);
  d.setDate(d.getDate() + day);
  return d;
};
const isoOf = (day: number) => {
  const d = dateOf(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Today's day number: null on the server and during hydration.
const subscribeDay = (cb: () => void) => {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
};
const useToday = () => useSyncExternalStore(subscribeDay, () => dayNumberOf(new Date()), () => null);

const chunks = new Map<string, Promise<unknown[]>>();
function fetchPool<T>(kind: "ayah" | "hadith", index: number, size: number): Promise<T> {
  const key = `${kind}/${Math.floor(index / size)}`;
  let p = chunks.get(key);
  if (!p) {
    p = fetch(`/ar/daily-content/pool/${key}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    p.catch(() => chunks.delete(key));
    chunks.set(key, p);
  }
  return p.then((list) => list[index % size] as T);
}

type Favorite = { kind: Kind; id: string; text: string; reference: string; note?: string; quran?: boolean };

export function DailyContent({
  meta,
  entries,
  surahNames,
}: {
  meta: DailyMeta;
  entries: { duas: DailyEntry[]; adhkar: DailyEntry[] };
  surahNames: { ar: string; en: string }[];
}) {
  const t = useTranslations("daily-content");
  const tf = useTranslations("features");
  const locale = useLocale();
  const today = useToday();
  const [picked, setPicked] = useState<number | null>(null);
  const [filter, setFilter] = useState<Kind | null>(null);
  const [favOpen, setFavOpen] = useState(false);
  const [favorites, setFavorites] = useLocalStorage<Favorite[]>("yusr.daily-content.favorites", []);
  const day = picked ?? today;
  const isToday = day === today;

  const [ayah, setAyah] = useState<{ day: number; v: DailyAyah } | null>(null);
  const [hadith, setHadith] = useState<{ day: number; v: DailyHadith } | null>(null);
  const [failed, setFailed] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (day == null) return;
    let alive = true;
    Promise.all([
      fetchPool<DailyAyah>("ayah", day % meta.ayahs, meta.chunk),
      fetchPool<DailyHadith>("hadith", day % meta.hadiths, meta.chunk),
    ])
      .then(([a, h]) => {
        if (!alive) return;
        setAyah({ day, v: a });
        setHadith({ day, v: h });
      })
      .catch(() => alive && setFailed(day));
    return () => {
      alive = false;
    };
  }, [day, meta, retry]);

  const dateLabel = (d: number, opts: Intl.DateTimeFormatOptions, calendar = "gregory") =>
    new Intl.DateTimeFormat(`${locale === "ar" ? "ar-EG" : "en-US"}-u-ca-${calendar}`, opts).format(dateOf(d));

  const toggleFav = (f: Favorite) =>
    setFavorites((list) => (list.some((x) => x.id === f.id) ? list.filter((x) => x.id !== f.id) : [f, ...list]));
  const isFav = (id: string) => favorites.some((x) => x.id === id);

  const surahName = (n: number) => (locale === "ar" ? surahNames[n - 1].ar : surahNames[n - 1].en);
  const loading = <p className="py-8 text-center text-sm text-muted-foreground">{t("loading")}</p>;
  const error = (
    <div className="py-6 text-center text-sm text-muted-foreground">
      <p>{t("error")}</p>
      <button
        type="button"
        onClick={() => {
          setFailed(null);
          setRetry((n) => n + 1);
        }}
        className="mt-3 rounded-full border px-4 py-1.5 text-brand hover:border-brand/50"
      >
        {t("retry")}
      </button>
    </div>
  );

  const entryCard = (kind: "dua" | "dhikr", list: DailyEntry[]) => {
    if (day == null) return <Card kind={kind}>{loading}</Card>;
    const e = list[day % list.length];
    const fav: Favorite = { kind, id: e.id, text: e.plain, reference: e.reference, note: e.note, quran: !!e.quran };
    return (
      <Card kind={kind} fav={isFav(e.id)} onFav={() => toggleFav(fav)}>
        {e.quran ? (
          <p dir="rtl" className="quran-text text-center text-2xl">
            {e.quran.ayahs.map((v) => (
              <span key={v.n}>
                {v.text} <span className="ayah-marker">﴿{toLocaleDigits(v.n, "ar")}﴾</span>{" "}
              </span>
            ))}
          </p>
        ) : (
          <p dir="rtl" lang="ar" className="text-center text-xl leading-loose">{e.text}</p>
        )}
        <Footer reference={e.reference} note={e.note} copy={`${e.plain}\n\n${e.reference}`} />
      </Card>
    );
  };

  const cards: Record<Kind, ReactNode> = {
    ayah: (() => {
      const v = ayah && ayah.day === day ? ayah.v : null;
      if (!v) return <Card kind="ayah">{failed === day ? error : loading}</Card>;
      const ref = t("ayahRef", { surah: surahName(v.s), n: toLocaleDigits(v.a, locale) });
      const id = `ayah_${v.s}_${v.a}`;
      return (
        <Card kind="ayah" fav={isFav(id)} onFav={() => toggleFav({ kind: "ayah", id, text: `﴿${v.text}﴾`, reference: ref, quran: true })}>
          <p dir="rtl" className="quran-text text-center text-2xl sm:text-3xl">
            {v.text} <span className="ayah-marker">﴿{toLocaleDigits(v.a, "ar")}﴾</span>
          </p>
          <Tafsir key={id} text={v.tafseer} />
          <Footer
            reference={ref}
            copy={`﴿${v.text}﴾\n\n${ref}\n\n${t("app")}`}
            link={<Link href={`/quran/${v.s}#ayah-${v.a}`} className="text-brand hover:underline">{t("openSurah")}</Link>}
          />
        </Card>
      );
    })(),
    hadith: (() => {
      const v = hadith && hadith.day === day ? hadith.v : null;
      if (!v) return <Card kind="hadith" subtitle={t("fromBukhari")}>{failed === day ? error : loading}</Card>;
      const ref = t("hadithRef", { n: hadithNo(v.number, locale) });
      const id = `hadith_${v.book}_${v.number}`;
      const showEn = locale === "en" && !!v.en;
      const href = `/hadith/bukhari/${v.book}${v.page > 1 ? `/${v.page}` : ""}#${hadithAnchor(v.number)}`;
      return (
        <Card kind="hadith" subtitle={t("fromBukhari")} fav={isFav(id)} onFav={() => toggleFav({ kind: "hadith", id, text: v.ar, reference: ref })}>
          <p dir="rtl" lang="ar" className="text-lg leading-loose">{v.ar}</p>
          {showEn && <p dir="ltr" lang="en" className="mt-4 whitespace-pre-line border-t pt-4 leading-relaxed text-muted-foreground">{v.en}</p>}
          <Footer
            reference={ref}
            copy={`${v.ar}${showEn ? `\n\n${v.en}` : ""}\n\n${ref}\n\n${t("app")}`}
            link={<Link href={href} className="text-brand hover:underline">{t("openHadith")}</Link>}
          />
        </Card>
      );
    })(),
    dua: entryCard("dua", entries.duas),
    dhikr: entryCard("dhikr", entries.adhkar),
  };

  return (
    <>
      <section className="hero-gradient relative mb-5 overflow-hidden rounded-2xl p-5 text-white shadow-xl shadow-primary/20 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{tf("daily-content.title")}</h1>
            <p className="mt-2 text-lg font-bold text-gold" suppressHydrationWarning>
              {day != null ? dateLabel(day, { weekday: "long", day: "numeric", month: "long" }, "islamic-umalqura") : " "}
              {day != null && ` ${dateLabel(day, { year: "numeric" }, "islamic-umalqura")}`}
            </p>
            <p className="mt-1 text-sm text-white/75" suppressHydrationWarning>
              {day != null ? `${dateLabel(day, { day: "numeric", month: "long", year: "numeric" })} · ` : ""}
              {isToday ? t("subtitle") : t("archive")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isToday && today != null && (
              <button type="button" onClick={() => setPicked(null)} className="rounded-full bg-gold px-3 py-1.5 text-sm font-medium text-black">
                {t("backToToday")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setFavOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            >
              <Star className="size-4 text-gold" />
              {t("favorites")}
              {favorites.length > 0 && <span className="tabular-nums">({toLocaleDigits(favorites.length, locale)})</span>}
            </button>
          </div>
        </div>

        <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
          {today != null &&
            Array.from({ length: STRIP_DAYS }, (_, i) => today - i).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setPicked(d === today ? null : d)}
                className={cn(
                  "flex min-w-14 shrink-0 flex-col items-center rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs transition hover:bg-white/10",
                  d === day && "border-gold/60 bg-gold/15",
                )}
              >
                <span className="text-white/70">{d === today ? t("today") : dateLabel(d, { weekday: "short" })}</span>
                <span className="mt-0.5 text-base font-bold tabular-nums">{dateLabel(d, { day: "numeric" })}</span>
              </button>
            ))}
          <label className="flex min-w-14 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs hover:bg-white/10">
            <CalendarDays className="size-4 text-gold" />
            <span className="sr-only">{t("pickDate")}</span>
            <input
              type="date"
              aria-label={t("pickDate")}
              className="mt-1 w-[7.5rem] bg-transparent text-[11px] text-white [color-scheme:dark]"
              max={today != null ? isoOf(today) : undefined}
              value={day != null ? isoOf(day) : ""}
              onChange={(e) => {
                if (!e.target.value) return;
                const [y, m, d] = e.target.value.split("-").map(Number);
                const n = dayNumberOf(new Date(y, m - 1, d));
                setPicked(today != null && n >= today ? null : n);
              }}
            />
          </label>
        </div>
      </section>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {([null, ...KINDS] as (Kind | null)[]).map((k) => {
          const Icon = k ? ICONS[k] : null;
          return (
            <button
              key={k ?? "all"}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition",
                filter === k ? "border-primary bg-primary text-primary-foreground" : "border-brand/25 bg-brand/5 text-brand hover:border-brand/50",
              )}
            >
              {Icon && <Icon className="size-4" />}
              {k ? t(`${k}Short`) : t("all")}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {KINDS.filter((k) => !filter || filter === k).map((k) => (
          <div key={k} className={cn(filter && "lg:col-span-2")}>{cards[k]}</div>
        ))}
      </div>

      <Dialog open={favOpen} onOpenChange={setFavOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Star className="size-5 text-gold" />
            {t("favorites")}
          </DialogTitle>
          {favorites.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("noFavorites")}</p>
          ) : (
            <ul className="space-y-3">
              {favorites.map((f) => (
                <li key={f.id} className="rounded-2xl border bg-card p-4">
                  <p className="mb-2 text-xs font-medium text-brand">{t(f.kind)}</p>
                  <p dir="rtl" className={cn("leading-loose", f.quran && "quran-text text-xl")}>{f.text}</p>
                  <p className="mt-2 text-xs text-muted-foreground" dir="auto">{f.reference}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <CopyShareButtons text={`${f.text}\n\n${f.reference}`} />
                    <button
                      type="button"
                      onClick={() => toggleFav(f)}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      {t("unfavorite")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Card({ kind, subtitle, fav, onFav, children }: { kind: Kind; subtitle?: string; fav?: boolean; onFav?: () => void; children: ReactNode }) {
  const t = useTranslations("daily-content");
  const Icon = ICONS[kind];
  return (
    <article className="h-full rounded-2xl border bg-card p-5">
      <header className="mb-4 flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-brand">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">{t(kind)}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {onFav && (
          <button
            type="button"
            onClick={onFav}
            aria-pressed={fav}
            aria-label={fav ? t("unfavorite") : t("favorite")}
            title={fav ? t("unfavorite") : t("favorite")}
            className="grid size-9 place-items-center rounded-full hover:bg-muted"
          >
            <Star className={cn("size-5", fav ? "fill-gold text-gold" : "text-muted-foreground")} />
          </button>
        )}
      </header>
      {children}
    </article>
  );
}

function Footer({ reference, note, copy, link }: { reference: string; note?: string; copy: string; link?: ReactNode }) {
  return (
    <div className="mt-4 border-t pt-3">
      <p className="text-sm font-medium text-brand" dir="auto">{reference}</p>
      {note && <p className="mt-1 text-sm text-muted-foreground" dir="rtl">{note}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <CopyShareButtons text={copy} />
        {link && <span className="text-sm">{link}</span>}
      </div>
    </div>
  );
}

function Tafsir({ text }: { text: string }) {
  const t = useTranslations("daily-content");
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > 220;
  return (
    <div className="mt-4 rounded-xl bg-muted p-4" dir="rtl">
      <p className="mb-1 text-xs font-bold text-gold">{t("tafsir")}</p>
      <p className="text-sm leading-loose">{long && !open ? `${text.slice(0, 220)}…` : text}</p>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-1 text-xs font-medium text-brand hover:underline">
          {open ? t("less") : t("more")}
        </button>
      )}
    </div>
  );
}
