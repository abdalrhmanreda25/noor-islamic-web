import { routing } from "@/i18n/routing";
import { getAllHadithBooks, getHadithBook } from "@/lib/data/hadith";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const books = await getAllHadithBooks();
  return routing.locales.flatMap((locale) =>
    books.map(({ collection, book }) => ({ locale, collection, book: book.id }))
  );
}

export async function GET(_req: Request, { params }: RouteContext<"/[locale]/hadith/[collection]/[book]/hadiths.json">) {
  const { collection, book } = await params;
  const list = await getHadithBook(collection, book).catch(() => null);
  if (!list) return new Response("Not found", { status: 404 });
  return Response.json(list);
}
