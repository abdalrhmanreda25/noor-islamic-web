"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage } from "@/hooks/use-local-storage";

/** Wraps server-rendered verses; highlights show only while `data-diff="on"`. */
export function DiffToggle({ children }: { children: ReactNode }) {
  const t = useTranslations("mutashabihat");
  const [on, setOn] = useLocalStorage("yusr.mutashabihat.showDiffs", true);
  return (
    <div data-diff={on ? "on" : "off"} className="group/diff">
      <div className="sticky top-14 z-30 -mx-4 mb-5 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium">
          <Switch checked={on} onCheckedChange={setOn} />
          {on ? <Eye className="size-4 text-brand" /> : <EyeOff className="size-4 text-muted-foreground" />}
          {on ? t("showDiffs") : t("testYourself")}
        </label>
      </div>
      {children}
    </div>
  );
}
