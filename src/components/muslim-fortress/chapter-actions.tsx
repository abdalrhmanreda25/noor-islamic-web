"use client";

import { ArrowLeft, Bookmark, BookmarkCheck, CircleCheck, Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { HISN_FAVORITES_KEY, HISN_LAST_KEY, HISN_READ_KEY } from "./fortress-list";

const toggle = (list: number[], n: number) => (list.includes(n) ? list.filter((x) => x !== n) : [...list, n]);

/** Favorite toggle for the chapter header; also records the chapter as last opened. */
export function FavoriteButton({ n }: { n: number }) {
  const t = useTranslations("muslim-fortress");
  const [favorites, setFavorites] = useLocalStorage<number[]>(HISN_FAVORITES_KEY, []);
  const [, setLast] = useLocalStorage<number | null>(HISN_LAST_KEY, null);
  useEffect(() => setLast(n), [n, setLast]);
  const isFav = favorites.includes(n);
  return (
    <Button variant="outline" size="lg" className="h-10 rounded-xl px-3" onClick={() => setFavorites((f) => toggle(f, n))}>
      {isFav ? <BookmarkCheck className="text-gold" /> : <Bookmark />}
      {isFav ? t("unfavorite") : t("favorite")}
    </Button>
  );
}

/** Mark-as-read and next chapter, at the end of a chapter. */
export function ChapterActions({ n, next }: { n: number; next?: { n: number; title: string } }) {
  const t = useTranslations("muslim-fortress");
  const [read, setRead] = useLocalStorage<number[]>(HISN_READ_KEY, []);
  const isRead = read.includes(n);
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
      <Button
        variant={isRead ? "secondary" : "default"}
        size="lg"
        className="h-11 rounded-xl px-4"
        onClick={() => setRead((r) => toggle(r, n))}
      >
        {isRead ? <CircleCheck /> : <Circle />}
        {isRead ? t("read") : t("markRead")}
      </Button>
      {next && (
        <Button
          variant="outline"
          size="lg"
          className="h-11 rounded-xl px-4"
          nativeButton={false}
          render={<Link href={`/muslim-fortress/${next.n}`} />}
        >
          {t("nextChapter")}: <span className="max-w-48 truncate">{next.title}</span>
          <ArrowLeft className="ltr:rotate-180" />
        </Button>
      )}
    </div>
  );
}
