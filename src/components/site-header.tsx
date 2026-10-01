"use client";

import { LayoutGrid, Languages, Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FEATURES, featuresBySection, PRIMARY_NAV } from "@/config/features";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("yusr.theme", dark ? "dark" : "light");
  } catch {}
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const tf = useTranslations("features");
  const ts = useTranslations("sections");
  const tapp = useTranslations("app");
  const locale = useLocale();
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="flex items-center gap-2 text-primary dark:text-gold">
          <Logo className="size-9" />
          <span className="text-lg font-bold">{tapp("name")}</span>
        </Link>

        <nav className="ms-6 hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((id) => {
            const f = FEATURES.find((x) => x.id === id)!;
            return (
              <Link
                key={id}
                href={f.href}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground",
                  isActive(f.href) && "bg-secondary text-foreground",
                )}
              >
                {tf(`${id}.title`)}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={pathname} locale={locale === "ar" ? "en" : "ar"} />}
          >
            <Languages />
            <span className="hidden sm:inline">{t("language")}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("theme")}>
            <Sun className="hidden dark:block" />
            <Moon className="dark:hidden" />
          </Button>
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label={t("menu")} />}>
              <LayoutGrid />
            </SheetTrigger>
            <SheetContent side={locale === "ar" ? "left" : "right"} className="w-80 overflow-y-auto p-4">
              <SheetTitle className="mb-2 text-lg font-bold">{t("menu")}</SheetTitle>
              <nav className="space-y-4">
                {featuresBySection().map(({ section, features }) => (
                  <div key={section}>
                    <p className="mb-1 px-3 text-xs font-medium text-muted-foreground">{ts(section)}</p>
                    {features.map(({ id, href, icon: Icon }) => (
                      <Link
                        key={id}
                        href={href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted",
                          isActive(href) && "bg-secondary font-medium",
                        )}
                      >
                        <Icon className="size-4 text-brand" />
                        {tf(`${id}.title`)}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
