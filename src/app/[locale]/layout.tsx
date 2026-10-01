import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { InlineScript } from "@/components/inline-script";
import { SiteHeader } from "@/components/site-header";
import "../globals.css";

const tajawal = localFont({
  variable: "--font-tajawal",
  src: [
    { path: "../../fonts/Tajawal-Regular.ttf", weight: "400" },
    { path: "../../fonts/Tajawal-Medium.ttf", weight: "500" },
    { path: "../../fonts/Tajawal-Bold.ttf", weight: "700" },
  ],
});

const hafs = localFont({
  variable: "--font-hafs",
  src: "../../fonts/KfgqpcHafsUthmanicScriptRegular-nARZ1.ttf",
});

// Applies the saved theme before paint to avoid a light flash in dark mode.
const themeScript = `try{var t=localStorage.getItem("yusr.theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });
  return {
    title: { default: t("name"), template: `%s | ${t("name")}` },
    description: t("tagline"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${tajawal.variable} ${hafs.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
