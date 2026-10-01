"use client";

import { BookOpen, Check, Copy, Download, Edit3, Loader2, Quote, Search, Share2, Shuffle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toLocaleDigits } from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { type CardFonts, drawCard } from "./draw-card";
import {
  ASPECTS,
  type Aspect,
  type ContentType,
  DEFAULT_DESIGN,
  type Design,
  FONTS,
  LAYOUTS,
  STYLES,
  arabicDigits,
} from "./presets";

export type CardSurah = { number: number; name: string; nameEn: string; ayahs: number };
export type CardHadith = { number: number; title: string; text: string; source: string };

const MAX_CUSTOM = 1200;

const plain = (s: string) =>
  s
    .replace(/[ؐ-ًؚ-ٟۖ-ۭـ]/g, "")
    .replace(/ٰ/g, "ا")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");

/** Resolves the next/font family names (exposed as CSS variables) for canvas use. */
function cssFont(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

export function CardMaker({
  surahs,
  hadiths,
  initialAyahs,
}: {
  surahs: CardSurah[];
  hadiths: CardHadith[];
  initialAyahs: string[];
}) {
  const t = useTranslations("card-maker");
  const locale = useLocale();
  const d = (n: number) => toLocaleDigits(n, locale);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [type, setType] = useState<ContentType>("quran");
  const [surah, setSurah] = useState(2);
  const [ayah, setAyah] = useState(255);
  const [ayahCache, setAyahCache] = useState<Record<number, string[]>>({ 2: initialAyahs });
  const [hadithNo, setHadithNo] = useState(1);
  const [hadithQuery, setHadithQuery] = useState("");
  const [customText, setCustomText] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [stored, setDesign] = useLocalStorage<Design>("yusr.card-maker.design", DEFAULT_DESIGN);
  const design = { ...DEFAULT_DESIGN, ...stored };
  const [fonts, setFonts] = useState<CardFonts | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const set = <K extends keyof Design>(key: K, value: Design[K]) => setDesign((p) => ({ ...DEFAULT_DESIGN, ...p, [key]: value }));
  const style = STYLES.find((s) => s.id === design.style) ?? STYLES[0];
  const surahInfo = surahs[surah - 1];
  const verses = ayahCache[surah];

  // Fetch the surah text when it isn't cached yet.
  useEffect(() => {
    if (ayahCache[surah]) return;
    let cancelled = false;
    fetch(`/${locale}/card-maker/ayahs/${surah}`)
      .then((r) => r.json())
      .then((list: string[]) => !cancelled && setAyahCache((c) => ({ ...c, [surah]: list })))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [surah, ayahCache, locale]);

  // Fonts must be loaded before canvas text is drawn.
  useEffect(() => {
    const f: CardFonts = {
      quran: cssFont("--font-hafs", "serif"),
      naskh: cssFont("--font-hafs", "serif"),
      modern: cssFont("--font-tajawal", "sans-serif"),
      label: cssFont("--font-tajawal", "sans-serif"),
    };
    Promise.all([
      document.fonts.load(`40px ${f.quran}`, "بِسۡمِ ٱللَّهِ ١٢٣"),
      document.fonts.load(`40px ${f.modern}`, "قال الله تعالى"),
      document.fonts.load(`700 40px ${f.label}`, "قال الله تعالى"),
    ])
      .catch(() => {})
      .finally(() => setFonts(f));
  }, []);

  const hadith = hadiths.find((h) => h.number === hadithNo) ?? hadiths[0];
  const verse = verses?.[ayah - 1]?.trim() ?? "";
  const content = useMemo(() => {
    if (type === "quran")
      return {
        type,
        text: verse ? `${verse} ${arabicDigits(ayah)}` : "",
        plainText: verse,
        reference: t("quranRef", { surah: surahInfo.name, ayah: arabicDigits(ayah) }),
      };
    if (type === "hadith")
      return {
        type,
        text: hadith.text,
        plainText: hadith.text,
        reference: t("hadithRef", { source: hadith.source || t("nawawi"), n: arabicDigits(hadith.number) }),
      };
    return { type, text: customText.trim(), plainText: customText.trim(), reference: customSource.trim() };
  }, [type, verse, ayah, surahInfo, hadith, customText, customSource, t]);

  useEffect(() => {
    if (!fonts || !canvasRef.current) return;
    drawCard(canvasRef.current, content, design, style, fonts, {
      quran: t("card.quran"),
      hadith: t("card.hadith"),
      quranTag: t("card.quranTag"),
      empty: t("card.empty"),
      watermark: t("card.watermark"),
    });
    // design is rebuilt each render; depend on its fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fonts, content, style, design.aspect, design.layout, design.font, design.pattern, design.scale, t]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const shareText = content.reference
    ? `${content.plainText}\n${type === "quran" ? `﴿ ${content.reference} ﴾` : content.reference}`
    : content.plainText;

  const exportPng = async (mode: "share" | "download") => {
    if (!content.text) return flash(t("writeFirst"));
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    try {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!blob) return;
      const file = new File([blob], `yusr-card-${Date.now()}.png`, { type: "image/png" });
      if (mode === "share" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText }).catch(() => {});
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } finally {
      setBusy(false);
    }
  };

  const randomAyah = () => {
    const s = Math.floor(Math.random() * 114) + 1;
    setSurah(s);
    setAyah(Math.floor(Math.random() * surahs[s - 1].ayahs) + 1);
  };

  const filteredHadiths = useMemo(() => {
    const q = plain(hadithQuery.trim());
    if (!q) return hadiths;
    return hadiths.filter((h) => String(h.number) === q || plain(h.title).includes(q) || plain(h.text).includes(q));
  }, [hadithQuery, hadiths]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border bg-card p-1.5">
          {(
            [
              ["quran", BookOpen],
              ["hadith", Quote],
              ["custom", Edit3],
            ] as const
          ).map(([k, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setType(k)}
              className={`flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-medium transition ${
                type === k ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <Icon className="size-4" /> {t(`types.${k}`)}
            </button>
          ))}
        </div>

        {type === "quran" && (
          <Panel
            title={t("pickAyah")}
            action={
              <Button size="sm" variant="ghost" onClick={randomAyah} className="text-brand">
                <Shuffle className="size-4" /> {t("random")}
              </Button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">{t("surah")}</span>
                <select
                  value={surah}
                  onChange={(e) => {
                    const s = Number(e.target.value);
                    setSurah(s);
                    if (ayah > surahs[s - 1].ayahs) setAyah(1);
                  }}
                  className="h-9 w-full rounded-md border bg-card px-2"
                >
                  {surahs.map((s) => (
                    <option key={s.number} value={s.number}>
                      {d(s.number)}. {locale === "ar" ? s.name : `${s.nameEn} (${s.name})`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 flex justify-between text-muted-foreground">
                  {t("ayah")} <span>{t("of", { count: d(surahInfo.ayahs) })}</span>
                </span>
                <Input
                  type="number"
                  min={1}
                  max={surahInfo.ayahs}
                  value={ayah}
                  onChange={(e) => setAyah(Math.min(surahInfo.ayahs, Math.max(1, Number(e.target.value) || 1)))}
                />
              </label>
            </div>
            <AyahSearch
              onPick={(s, a) => {
                setSurah(s);
                setAyah(a);
              }}
              surahs={surahs}
            />
          </Panel>
        )}

        {type === "hadith" && (
          <Panel title={t("nawawi")}>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={hadithQuery} onChange={(e) => setHadithQuery(e.target.value)} placeholder={t("searchHadith")} className="ps-9" />
            </div>
            <ul className="max-h-64 space-y-1 overflow-y-auto" dir="rtl">
              {filteredHadiths.map((h) => (
                <li key={h.number}>
                  <button
                    type="button"
                    onClick={() => setHadithNo(h.number)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm transition ${
                      h.number === hadithNo ? "bg-secondary font-bold text-brand" : "hover:bg-muted"
                    }`}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs">{arabicDigits(h.number)}</span>
                    {h.title}
                  </button>
                </li>
              ))}
              {filteredHadiths.length === 0 && <li className="p-3 text-sm text-muted-foreground">{t("noResults")}</li>}
            </ul>
          </Panel>
        )}

        {type === "custom" && (
          <Panel title={t("customTitle")}>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value.slice(0, MAX_CUSTOM))}
              placeholder={t("customHint")}
              rows={5}
              dir="rtl"
              className="w-full rounded-md border bg-card p-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <p className="mb-3 text-end text-xs text-muted-foreground">
              {d(customText.length)} / {d(MAX_CUSTOM)}
            </p>
            <Input value={customSource} onChange={(e) => setCustomSource(e.target.value)} placeholder={t("customSource")} dir="rtl" />
          </Panel>
        )}

        <Panel title={t("design")}>
          <Field label={t("style")}>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  title={t(`styles.${s.id}`)}
                  aria-label={t(`styles.${s.id}`)}
                  aria-pressed={s.id === style.id}
                  onClick={() => set("style", s.id)}
                  className={`grid size-11 place-items-center rounded-xl border-2 transition ${
                    s.id === style.id ? "border-brand ring-2 ring-brand/30" : "border-border"
                  }`}
                  style={{ background: `linear-gradient(225deg, ${s.bg[0]}, ${s.bg[s.bg.length - 1]})` }}
                >
                  <span className="size-3 rounded-full" style={{ background: s.accent }} />
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t(`styles.${style.id}`)}</p>
          </Field>
          <Field label={t("layout")}>
            <Chips options={LAYOUTS} value={design.layout} onChange={(v) => set("layout", v)} label={(v) => t(`layouts.${v}`)} />
          </Field>
          <label className="flex items-center justify-between gap-3 py-1 text-sm">
            {t("pattern")}
            <Switch checked={design.pattern} onCheckedChange={(v) => set("pattern", v)} />
          </label>
          <Field label={t("aspect")}>
            <Chips
              options={Object.keys(ASPECTS) as Aspect[]}
              value={design.aspect}
              onChange={(v) => set("aspect", v)}
              label={(v) => t(`aspects.${v}`)}
            />
          </Field>
          {type !== "quran" && (
            <Field label={t("font")}>
              <Chips options={FONTS} value={design.font} onChange={(v) => set("font", v)} label={(v) => t(`fonts.${v}`)} />
            </Field>
          )}
          <Field label={`${t("fontSize")} · ${d(Math.round(design.scale * 100))}%`}>
            <input
              type="range"
              min={0.7}
              max={1.5}
              step={0.05}
              value={design.scale}
              onChange={(e) => set("scale", Number(e.target.value))}
              className="w-full accent-[var(--brand)]"
            />
          </Field>
        </Panel>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 text-sm font-bold text-muted-foreground">{t("preview")}</p>
        <div className="mx-auto overflow-hidden rounded-2xl border shadow-lg" style={{ maxWidth: design.aspect === "story" ? 300 : 420 }}>
          {!fonts && <div className="grid aspect-[4/5] place-items-center bg-muted"><Loader2 className="size-6 animate-spin text-brand" /></div>}
          <canvas ref={canvasRef} className={`block h-auto w-full ${fonts ? "" : "hidden"}`} />
        </div>
        {design.aspect !== "story" && content.text.length > 400 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gold/10 p-3 text-sm">
            {t("suggestStory")}
            <Button size="sm" variant="outline" onClick={() => set("aspect", "story")}>{t("useStory")}</Button>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={() => exportPng("share")} disabled={busy} className="col-span-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
            {busy ? t("preparing") : t("share")}
          </Button>
          <Button variant="outline" onClick={() => exportPng("download")} disabled={busy}>
            <Download className="size-4" /> {t("download")}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!content.text) return flash(t("writeFirst"));
              try {
                await navigator.clipboard.writeText(shareText);
                flash(t("copied"));
              } catch {}
            }}
          >
            {toast === t("copied") ? <Check className="size-4" /> : <Copy className="size-4" />} {t("copyText")}
          </Button>
        </div>
        {toast && <p className="mt-2 text-center text-sm text-brand" role="status">{toast}</p>}
      </div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-bold text-brand">{title}</h2>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-xl border px-4 py-1.5 text-sm transition ${
            o === value ? "border-brand bg-primary font-bold text-primary-foreground" : "bg-secondary hover:border-brand/50"
          }`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

type IndexRow = [number, number, string];

function AyahSearch({ onPick, surahs }: { onPick: (s: number, a: number) => void; surahs: CardSurah[] }) {
  const t = useTranslations("card-maker");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<IndexRow[] | null>(null);
  const q = plain(query.trim());

  const requested = useRef(false);
  useEffect(() => {
    if (q.length < 2 || requested.current) return;
    requested.current = true;
    fetch(`/${locale}/card-maker/search-index`)
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => {
        requested.current = false;
      });
  }, [q, locale]);

  const hits = useMemo(() => {
    if (q.length < 2 || !index) return [];
    const out: IndexRow[] = [];
    for (const row of index) {
      if (plain(row[2]).includes(q)) out.push(row);
      if (out.length >= 30) break;
    }
    return out;
  }, [q, index]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchAyah")} className="ps-9" dir="rtl" />
      </div>
      {q.length >= 2 && (
        <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
          {!index && <li className="p-2 text-sm text-muted-foreground">{t("searching")}</li>}
          {index && hits.length === 0 && <li className="p-2 text-sm text-muted-foreground">{t("noResults")}</li>}
          {hits.map(([s, a, text]) => (
            <li key={`${s}:${a}`}>
              <button
                type="button"
                onClick={() => {
                  onPick(s, a);
                  setQuery("");
                }}
                className="w-full rounded-lg px-3 py-2 text-start hover:bg-muted"
              >
                <span className="block text-xs font-bold text-brand">
                  {locale === "ar" ? `سورة ${surahs[s - 1].name}` : surahs[s - 1].nameEn} · {toLocaleDigits(a, locale)}
                </span>
                <span className="line-clamp-1 text-sm" dir="rtl">{text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
