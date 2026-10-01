import { toLocaleDigits } from "@/components/page-header";
import { cn } from "@/lib/utils";
import type { MushafPage as PageData } from "@/lib/data/quran-pages";

/** Row pitch in em of the page font: tight like print, marks interleave. */
export const ROW_EM = 1.75;
const ROWS = 15;
/** Basmala glyphs of the QCF4_BSML face (95 and 97 use a variant). */
const BASMALA = "齃𧻓𥳐龎";
const BASMALA_ALT = "齃𧻓𥳐𥉉";

export const pageFamily = (page: number) => `qcf-p${page}`;
export const ayahKey = (s: number, a: number) => `${s}:${a}`;

// QCF4 tajweed faces are COLR colour fonts with black baked into the palette,
// so text colour does nothing: dark mode swaps palette entries instead (the
// Flutter app inverts the glyph colours; this keeps the tajweed hues readable).
const DARK_INK = "#ece6d6";
const DARK_PALETTE = `0 ${DARK_INK}, 3 #ff7a7a, 6 #4cd447, 7 #8f97ff, 9 #ff6060, 12 #2c3d31, 13 ${DARK_INK}, 14 ${DARK_INK}`;

/** @font-face + dark palette rules for the given pages (and the basmala/title face). */
export function mushafFontCss(pages: number[], ext: string) {
  const face = (family: string, file: string) =>
    `@font-face{font-family:"${family}";src:url("/fonts/qcf/${file}.${ext}") format("${ext === "woff2" ? "woff2" : "truetype"}");font-display:block}` +
    `@font-palette-values --${family}-dark{font-family:"${family}";override-colors:${DARK_PALETTE}}` +
    `.dark .${family}{font-palette:--${family}-dark}`;
  return [face("qcf-bsml", "bsml"), ...pages.map((p) => face(pageFamily(p), `p${String(p).padStart(3, "0")}`))].join("");
}

type Props = {
  data: PageData;
  lineWidth: number;
  locale: string;
  surahName: (n: number) => string;
  juzLabel: string;
  selected?: string | null;
  bookmarked?: Set<string>;
  onAyah?: (surah: number, ayah: number) => void;
  className?: string;
};

/** One Madani mushaf page: 15 rows in the page's QCF4 font, inside the paper frame. */
export function MushafPage({ data, lineWidth, locale, surahName, juzLabel, selected, bookmarked, onAyah, className }: Props) {
  const family = pageFamily(data.page);
  const short = data.rows.length < ROWS;
  return (
    <article
      aria-label={`${data.page}`}
      className={cn(
        "rounded-md border-[3px] border-brand bg-[#fbf7ee] p-[3px] shadow-lg dark:border-brand/70 dark:bg-card",
        className,
      )}
    >
      <div className="rounded-sm border-[1.5px] border-gold p-0.5">
        <div className="rounded-[2px] border border-brand/30 px-[5%] pt-3 pb-1">
          <div className="@container">
            <div
              dir="rtl"
              className={cn("flex flex-col text-black dark:text-[#ece6d6]", short && "justify-center")}
              style={{ fontSize: `calc(100cqw / ${lineWidth})`, height: `${ROWS * ROW_EM}em` }}
            >
              {data.rows.map((row, i) => {
                const style = { height: `${ROW_EM}em` };
                if (row.t === "x") return <div key={i} style={style} />;
                if (row.t === "h")
                  return (
                    <div key={i} style={style} className="relative flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/fonts/qcf/surah-banner.png" alt="" className="absolute inset-0 m-auto h-full w-[95%] object-contain" />
                      <span
                        role="heading"
                        aria-level={2}
                        aria-label={surahName(row.s)}
                        className="qcf-bsml relative leading-none"
                        style={{ fontFamily: "qcf-bsml", fontSize: "0.95em" }}
                      >
                        {String.fromCharCode(0xf100 + row.s - 1)}
                      </span>
                    </div>
                  );
                if (row.t === "b")
                  return (
                    <div key={i} style={style} className="flex items-center justify-center">
                      <span className="qcf-bsml leading-none" style={{ fontFamily: "qcf-bsml", fontSize: "1.05em" }}>
                        {row.s === 95 || row.s === 97 ? BASMALA_ALT : BASMALA}
                      </span>
                    </div>
                  );
                return (
                  <div key={i} style={style} className="flex items-center justify-center">
                    <span className={cn(family, "whitespace-nowrap leading-none")} style={{ fontFamily: family, fontSize: `${row.z}em` }}>
                      {row.s.map(([s, a, glyphs], j) => {
                        const k = ayahKey(s, a);
                        return (
                          <span
                            key={j}
                            data-ayah={k}
                            onClick={onAyah && (() => onAyah(s, a))}
                            className={cn(
                              "cursor-pointer rounded-sm transition-colors",
                              selected === k ? "bg-gold/25" : bookmarked?.has(k) ? "bg-brand/15" : "hover:bg-gold/15",
                            )}
                          >
                            {glyphs}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <footer className="mt-2 flex items-center justify-between gap-2 border-t border-brand/30 pt-1.5 text-[11px] font-semibold text-brand">
            <span className="truncate">{juzLabel}</span>
            <span className="rounded-full bg-brand/10 px-3 py-0.5 text-xs font-bold">{toLocaleDigits(data.page, locale)}</span>
            <span className="truncate">{surahName(data.surahs[0])}</span>
          </footer>
        </div>
      </div>
    </article>
  );
}
