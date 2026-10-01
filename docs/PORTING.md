# Porting Yusr features from Flutter to the web

Flutter source: `/Users/abdalrhmanreda/Codex/Flutter/noon-islamic-android` (read-only, never edit it).
Web app: this repo. Next.js 16 App Router + next-intl + Tailwind v4 + shadcn (base-nova style, Base UI primitives).

## Read first
- `AGENTS.md`: this Next.js version differs from older versions. Check `node_modules/next/dist/docs/` before using an API you're unsure of.
- `params` / `searchParams` are Promises. Type pages with `PageProps<"/[locale]/route">` and layouts with `LayoutProps<...>`. Run `npx next typegen` after adding routes.
- shadcn components in `src/components/ui/` use Base UI, not Radix. To render a component as another element, use the `render` prop, not `asChild`, for example `<Button nativeButton={false} render={<Link href="/x" />}>`. Add more components with `npx shadcn@latest add <name> -y`.

## Where things go (each feature owns its own files)
| What | Path |
|---|---|
| Route | `src/app/[locale]/<route>/...` (route = the `href` in `src/config/features.ts`) |
| Feature components | `src/components/<feature-id>/` |
| Data conversion | `scripts/convert-<feature-id>.mjs`, writing to `data/<feature-id>/...` (read Flutter assets, or download the remote assets listed below) |
| Server data access | `src/lib/data/<feature-id>.ts` (copy the `load` pattern from `src/lib/data.ts`: fs + `react` `cache`) |
| Translations | `messages/ar/<feature-id>.json` + `messages/en/<feature-id>.json`. The file name is the namespace: `useTranslations("<feature-id>")` |

Do **not** edit shared files: `src/config/features.ts`, `src/components/site-header.tsx`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/lib/data.ts`, `src/lib/prayer.ts`, `src/app/globals.css`, `messages/*/{app,nav,home,features,sections}.json`. If you need a change there, say so in your final report. Exceptions are granted per agent in their task.

## Conventions
- Pages are server components. They call `setRequestLocale(locale)`, read data with fs at build time, and use `generateStaticParams` + `export const dynamicParams = false` for dynamic segments (generate for both `ar` and `en` via `routing.locales`). Interactivity goes in small `"use client"` components.
- Page title: `<PageHeader title=... subtitle=...>` from `@/components/page-header`. Also export `generateMetadata` returning `{ title }` (use `getTranslations("features")` → `t("<id>.title")`).
- Links: `Link` from `@/i18n/navigation` (locale-aware), never `next/link`.
- Arabic religious text (Quran, hadith, duas) always has `dir="rtl"`. Quran text uses the `quran-text` class (Uthmanic Hafs font). Ayah numbers: `﴿{toLocaleDigits(n,"ar")}﴾` in `ayah-marker`.
- Numbers shown to users: `toLocaleDigits(n, locale)` from `@/components/page-header`.
- Theme tokens only. Use `bg-card`, `bg-secondary`, `bg-muted`, `text-brand`, `text-gold`, `bg-primary`, `text-muted-foreground`, `border`, plus `.hero-gradient` for the dark-green feature banners (the Flutter header style). Never hard-code colors; dark mode must work.
- Card style used across the site: `rounded-2xl border bg-card p-5`, hover `hover:border-brand/50`. Grids: `grid gap-3 sm:grid-cols-2 lg:grid-cols-3`.
- Mobile first: no horizontal scroll at 360px.
- Persistent user state (trackers, khatma, settings, bookmarks) goes in `localStorage` under `yusr.<feature-id>.*`, wrapped in try/catch. Use the hook `useLocalStorage` in `src/hooks/use-local-storage.ts` (create it only if it doesn't exist).
- Location / prayer times: reuse `useLocation()` from `@/hooks/use-location` and `computePrayerTimes`, `nextPrayer` from `@/lib/prayer`.
- Audio: `<audio>` element. mp3quran surah URL = `${reciter.server}${String(surah).padStart(3,"0")}.mp3` (reciters in `data/reciters.json`, via `getReciters()`). Per-ayah audio: `https://everyayah.com/data/<folder>/<SSS><AAA>.mp3`.
- Skip mobile-only parts: notifications, home-screen widgets, alarms, background work, vibration-only UX, share-to-app intents. If a feature is mostly mobile-only, build the useful web part and say what you skipped.

## Remote assets (same files the app downloads)
Base: `https://github.com/Eslam-Aped-Ali/quran_model/releases/download/assets-v1/`
- `hadith-<id>-v1.json.gz` for id in bukhari, muslim, abudawud, tirmidhi, nasai, ibnmajah, malik, ahmed, darimi
- `tafsir-<id>-v1.json.gz` for id in jalalayn, ibn_katheer, qurtubi
- `qcf-tajweed-v1-pXXX-YYY.zip` (20-page chunks 001–580; pages 581–604 are bundled in `qcf_quran_plus-0.0.8/assets/fonts/qcf_tajweed/*.zip`)

Download in the conversion script (Node `fetch` + `zlib.gunzipSync`). Don't commit the raw downloads; write compact JSON into `data/`.

## Verify before reporting
1. `node scripts/convert-<id>.mjs` succeeds.
2. `npx next typegen && npx tsc --noEmit` is clean for your files.
3. `npx eslint <your files>` is clean.
4. A dev server is already running at http://localhost:3000. Use `curl -sL -o /dev/null -w '%{http_code}' http://localhost:3000/ar/<route>` (and `/en/...`): expect 200. Never start another dev server and never run `next build` (other agents work in parallel).
