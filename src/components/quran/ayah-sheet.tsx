"use client";

import { Bookmark, BookmarkCheck, Check, Copy, Pause, Play } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toLocaleDigits } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type AyahInfo = { text: string; tafseer: string };

const audioUrl = (s: number, a: number) =>
  `https://everyayah.com/data/Alafasy_128kbps/${String(s).padStart(3, "0")}${String(a).padStart(3, "0")}.mp3`;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surah: number;
  ayah: number;
  surahName: string;
  info?: AyahInfo;
  bookmarked: boolean;
  onBookmark: () => void;
};

/** Actions for a tapped ayah, like the app's verse actions: listen, copy, bookmark, tafsir. */
export function AyahSheet({ open, onOpenChange, surah, ayah, surahName, info, bookmarked, onBookmark }: Props) {
  const t = useTranslations("quran");
  const locale = useLocale();
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const key = `${surah}:${ayah}`;

  // Stop playback when the page goes away.
  useEffect(() => () => audio.current?.pause(), []);

  const toggleAudio = () => {
    if (playing === key) {
      audio.current?.pause();
      return;
    }
    audio.current?.pause();
    const el = new Audio(audioUrl(surah, ayah));
    el.onended = el.onpause = () => setPlaying((p) => (p === key ? null : p));
    el.play().then(() => setPlaying(key), () => setPlaying(null));
    audio.current = el;
  };

  const copy = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(`${info.text} ﴿${toLocaleDigits(ayah, "ar")}﴾ [${surahName}]`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[85vh] max-w-2xl overflow-y-auto rounded-t-2xl p-5">
        <SheetHeader className="p-0">
          <SheetTitle className="text-brand">
            {surahName} · {t("ayah", { n: toLocaleDigits(ayah, locale) })}
          </SheetTitle>
        </SheetHeader>
        {info && (
          <p dir="rtl" className="quran-text text-2xl leading-loose">
            {info.text} <span className="ayah-marker whitespace-nowrap">﴿{toLocaleDigits(ayah, "ar")}﴾</span>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant={playing === key ? "default" : "outline"} onClick={toggleAudio}>
            {playing === key ? <Pause /> : <Play />} {playing === key ? t("pause") : t("play")}
          </Button>
          <Button variant="outline" onClick={copy} disabled={!info}>
            {copied ? <Check /> : <Copy />} {copied ? t("copied") : t("copy")}
          </Button>
          <Button variant={bookmarked ? "default" : "outline"} onClick={onBookmark}>
            {bookmarked ? <BookmarkCheck /> : <Bookmark />} {bookmarked ? t("unbookmark") : t("bookmark")}
          </Button>
        </div>
        {info && (
          <section className="rounded-xl bg-muted p-4">
            <h3 className="mb-2 text-sm font-bold text-brand">{t("tafseer")}</h3>
            <p dir="rtl" className="text-base leading-loose text-muted-foreground">{info.tafseer}</p>
          </section>
        )}
      </SheetContent>
    </Sheet>
  );
}
