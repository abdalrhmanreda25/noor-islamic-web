"use client";

import { ArrowLeft, BookmarkCheck, Bookmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { SALAH_READ_KEY } from "./salah-guide-list";

/** Mark-as-read toggle and "next topic" link at the end of a topic. */
export function TopicActions({ id, next }: { id: string; next?: { id: string; question: string } }) {
  const t = useTranslations("salah-guide");
  const [read, setRead] = useLocalStorage<string[]>(SALAH_READ_KEY, []);
  const isRead = read.includes(id);

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
      <Button
        variant={isRead ? "secondary" : "default"}
        size="lg"
        className="h-11 rounded-xl px-4"
        onClick={() => setRead((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]))}
      >
        {isRead ? <BookmarkCheck /> : <Bookmark />}
        {isRead ? t("read") : t("markRead")}
      </Button>
      {next && (
        <Button
          variant="outline"
          size="lg"
          className="h-11 rounded-xl px-4"
          nativeButton={false}
          render={<Link href={`/salah-guide/${next.id}`} />}
        >
          {t("nextTopic")}: <span className="max-w-48 truncate">{next.question}</span>
          <ArrowLeft className="ltr:rotate-180" />
        </Button>
      )}
    </div>
  );
}
