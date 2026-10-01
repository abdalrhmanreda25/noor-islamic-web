"use client";

import { ChevronLeft, ChevronRight, ListTree } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { toLocaleDigits } from "@/components/page-header";
import { AyahSheet, type AyahInfo } from "@/components/quran/ayah-sheet";
import { MushafJump } from "@/components/quran/mushaf-jump";
import { ayahKey, MushafPage } from "@/components/quran/mushaf-page";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import type { MushafPage as PageData } from "@/lib/data/quran-pages";

export type Bookmark = { surah: number; ayah: number; page: number };
export const LAST_PAGE_KEY = "yusr.quran.lastPage";
export const BOOKMARKS_KEY = "yusr.quran.bookmarks";
const TOTAL = 604;

const WIDE = "(min-width: 1280px)";
const subscribeWide = (cb: () => void) => {
  const mq = matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

type Props = {
  page: number;
  /** The spread's pages, right (odd) page first. */
  spread: PageData[];
  lineWidth: number;
  surahs: { n: number; ar: string; en: string; page: number }[];
  juzPages: number[];
  ayahs: Record<string, AyahInfo>;
};

export function MushafReader({ page, spread, lineWidth, surahs, juzPages, ayahs }: Props) {
  const t = useTranslations("quran");
  const locale = useLocale();
  const router = useRouter();
  const wide = useSyncExternalStore(subscribeWide, () => matchMedia(WIDE).matches, () => false);
  const [selected, setSelected] = useState<{ page: number; key: string | null; open: boolean }>({ page, key: null, open: false });
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>(BOOKMARKS_KEY, []);
  const touch = useRef<{ x: number; y: number } | null>(null);

  // Selection belongs to the page it was made on.
  const current = selected.page === page ? selected : { page, key: null, open: false };

  const right = page % 2 ? page : page - 1;
  const step = wide ? 2 : 1;
  const base = wide ? right : page;
  const next = base + step <= TOTAL ? base + step : null;
  const prev = base - step >= 1 ? base - step : null;
  const go = useCallback((p: number | null) => p && router.push(`/quran/page/${p}`), [router]);

  const pageData = spread.find((d) => d.page === page) ?? spread[0];
  const surahName = useCallback(
    (n: number) => (locale === "ar" ? `سورة ${surahs[n - 1].ar}` : surahs[n - 1].en),
    [locale, surahs],
  );
  const bookmarked = useMemo(() => new Set(bookmarks.map((b) => ayahKey(b.surah, b.ayah))), [bookmarks]);

  // Last read page.
  useEffect(() => {
    try {
      localStorage.setItem(LAST_PAGE_KEY, JSON.stringify(page));
    } catch {}
  }, [page]);

  // Deep links: ?ayah=2:255, or /quran/2#ayah-255 (redirected here as ?surah=2#ayah-255).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const direct = params.get("ayah");
    const hash = /^#ayah-(\d+)$/.exec(location.hash);
    const surah = Number(params.get("surah"));
    if (direct && /^\d+:\d+$/.test(direct)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected({ page, key: direct, open: false });
    } else if (hash && surah) {
      const ayah = Number(hash[1]);
      import("../../../data/quran-pages/ayah-pages.json").then(({ default: pages }) => {
        const target = (pages as number[][])[surah - 1]?.[ayah - 1];
        if (!target) return;
        if (target === page) setSelected({ page, key: ayahKey(surah, ayah), open: false });
        else router.replace(`/quran/page/${target}?ayah=${surah}:${ayah}`);
      });
    }
  }, [page, router]);

  // Keyboard: the mushaf reads right to left, so ← is the next page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (current.open || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, select, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(next);
      else if (e.key === "ArrowRight") go(prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current.open, go, next, prev]);

  // Neighbouring pages: route payloads and their fonts.
  useEffect(() => {
    for (const p of [next, prev, next && next + 1, prev && prev + 1]) {
      if (!p || p > TOTAL) continue;
      router.prefetch(`/quran/page/${p}`);
    }
  }, [next, prev, router]);

  const toggleBookmark = (surah: number, ayah: number) =>
    setBookmarks((list) =>
      list.some((b) => b.surah === surah && b.ayah === ayah)
        ? list.filter((b) => !(b.surah === surah && b.ayah === ayah))
        : [...list, { surah, ayah, page }],
    );

  const sel = current.key ? current.key.split(":").map(Number) : null;
  const juzLabel = (d: PageData) => t("juz", { n: toLocaleDigits(d.juz, locale) });

  return (
    <div className="-mx-2 sm:mx-0">
      {/* Top bar, styled after the app: surah + juz on a card, page pill, arrows (← next). */}
      <div dir="rtl" className="mx-auto mb-4 flex max-w-3xl items-center gap-2">
        <NavButton label={t("prevPage")} disabled={!prev} onClick={() => go(prev)}>
          <ChevronRight />
        </NavButton>
        <div dir={locale === "ar" ? "rtl" : "ltr"} className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-full border bg-card px-4 py-2 shadow-sm">
          <div className="min-w-0">
            <p className="truncate font-bold text-brand">{pageData.surahs.map(surahName).join(" · ")}</p>
            <p className="text-xs text-muted-foreground">
              {juzLabel(pageData)} · {t("hizb", { n: toLocaleDigits(pageData.hizb, locale) })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <MushafJump page={page} surahs={surahs} surahName={surahName} juzPages={juzPages} />
            <span className="hero-gradient rounded-full px-3 py-1 text-xs font-bold text-white">
              {t("page", { n: toLocaleDigits(page, locale) })}
            </span>
          </div>
        </div>
        <NavButton label={t("nextPage")} disabled={!next} onClick={() => go(next)}>
          <ChevronLeft />
        </NavButton>
      </div>

      <div
        dir="rtl"
        className="mx-auto flex max-w-[34rem] touch-pan-y justify-center gap-4 xl:max-w-none"
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) go(dx > 0 ? next : prev);
        }}
      >
        {spread.map((d) => (
          <MushafPage
            key={d.page}
            data={d}
            lineWidth={lineWidth}
            locale={locale}
            surahName={surahName}
            juzLabel={juzLabel(d)}
            selected={current.key}
            bookmarked={bookmarked}
            onAyah={(s, a) => setSelected({ page, key: ayahKey(s, a), open: true })}
            className={cn("w-full min-w-0 xl:w-[min(34rem,calc((100vh_-_12rem)/1.62))]", d.page !== page && "hidden xl:block")}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <Link href="/quran" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand">
          <ListTree className="size-4" /> {t("index")}
        </Link>
      </div>

      {sel && (
        <AyahSheet
          open={current.open}
          onOpenChange={(open) => setSelected((s) => ({ ...s, page, open }))}
          surah={sel[0]}
          ayah={sel[1]}
          surahName={surahName(sel[0])}
          info={ayahs[current.key!]}
          bookmarked={bookmarked.has(current.key!)}
          onBookmark={() => toggleBookmark(sel[0], sel[1])}
        />
      )}
    </div>
  );
}

function NavButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-10 shrink-0 place-items-center rounded-xl border bg-card text-brand shadow-sm transition hover:border-brand/50 disabled:opacity-40 [&_svg]:size-5"
    >
      {children}
    </button>
  );
}
