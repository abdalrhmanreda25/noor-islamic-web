"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Jumps to #ayah-<n> on the server-rendered surah page. */
export function GoToAyah({ max }: { max: number }) {
  const t = useTranslations("tafseer");
  const [n, setN] = useState("");
  const go = () => {
    const v = Number(n.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)));
    if (v >= 1 && v <= max) location.hash = `ayah-${v}`;
  };
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <Input
        inputMode="numeric"
        value={n}
        onChange={(e) => setN(e.target.value)}
        placeholder={t("goToAyah")}
        aria-label={t("goToAyah")}
        className="h-9 w-36"
      />
      <Button type="submit" size="sm" variant="outline">
        {t("go")}
      </Button>
    </form>
  );
}

/** Copy / share an ayah with its tafsir. */
export function AyahActions({ text }: { text: string }) {
  const t = useTranslations("tafseer");
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else copy();
  };
  return (
    <div className="flex gap-1">
      <Button size="sm" variant="ghost" onClick={copy} className="text-muted-foreground">
        {copied ? <Check className="size-4 text-brand" /> : <Copy className="size-4" />}
        {copied ? t("copied") : t("copy")}
      </Button>
      <Button size="sm" variant="ghost" onClick={share} className="text-muted-foreground">
        <Share2 className="size-4" /> {t("share")}
      </Button>
    </div>
  );
}
