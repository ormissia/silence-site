import { RevealImg } from "@/components/media/reveal-image";
import { ImageContent } from "@/components/media/image-content";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookToolbar } from "@/components/reading/book-toolbar";
import { BookDialog } from "@/components/reading/book-dialog";
import { getReadingMetadata, getReadingSections, listReadingSummaries } from "@/lib/reading";

export function generateStaticParams() {
  return listReadingSummaries().map((book) => ({ slug: book.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const book = getReadingMetadata(params.slug);
  return { title: book ? `${book.title} — SILENCE` : "Reading — SILENCE" };
}

export default function ReadingEntryPage({ params, searchParams }: {
  params: { slug: string };
  searchParams: { cat?: string | string[]; view?: string | string[] };
}) {
  const book = getReadingMetadata(params.slug);
  if (!book) notFound();
  const sections = getReadingSections(book.slug);
  const all = listReadingSummaries();
  const next = all[(all.findIndex((entry) => entry.slug === book.slug) + 1) % all.length];
  const category = typeof searchParams.cat === "string" ? searchParams.cat : undefined;
  const fromEvolution = searchParams.view === "evolution";
  const shelfQuery = fromEvolution ? "?view=evolution" : category && category !== "all" ? `?cat=${encodeURIComponent(category)}` : "";
  const shelfHref = fromEvolution ? "/reading/evolution" : `/reading${shelfQuery}`;
  const stats = [
    ["Progress", book.progress], ["Rating", book.rating],
    ["Reading time", book.readingTime], ["Finished", book.finishedDate],
    ["Category", book.category], ["Started", book.readingDate],
    ["Last read", book.lastReadDate],
  ].filter(([, value]) => Boolean(value));

  return (
    <BookDialog key={book.slug} returnHref={shelfHref} titleId="book-detail-title">
    <article>
      <div className="reading-detail-panel relative bg-surface-raised">
        <BookToolbar title={book.title} cover={book.cover} author={book.author} rating={book.rating} readingTime={book.readingTime} titleId="book-detail-title" returnHref={shelfHref} returnLabel={fromEvolution ? "阅读演化" : "书架"} />

        <header className="grid gap-8 px-6 pb-10 pt-6 md:grid-cols-[180px_minmax(0,1fr)] md:gap-10 md:px-10 lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-14">
          <div className="mx-auto w-40 self-start overflow-hidden rounded-xl border border-ink/10 bg-ink/5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] md:w-full">
            {book.cover ? (
              <RevealImg src={book.cover} alt={book.title} className="block h-auto w-full" />
            ) : <div className="flex aspect-[2/3] items-center justify-center px-5 text-center font-serif text-lg text-muted">{book.title}</div>}
          </div>
          <div className="min-w-0 pt-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Reading Notes</p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <h1 id="book-detail-title" className="break-words text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-tight">{book.title}</h1>
            </div>
            {book.author && <p className="mt-3 text-sm italic leading-relaxed text-muted">{book.author}</p>}
            <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
              {stats.map(([label, value]) => (
                <div key={label} className="min-w-0 border-t divider-gradient pt-4 text-center">
                  <dt className="silence-pill silence-pill-accent !px-2.5 !py-1.5 !text-[11px] uppercase text-ink/80">{label}</dt>
                  <dd className="mt-3 break-words text-sm leading-relaxed text-ink/80">{value}</dd>
                </div>
              ))}
            </dl>
            {!!book.tags?.length && <div className="mt-6 flex flex-wrap gap-2">{book.tags.map(tag => <span key={tag} className="rounded-full border border-ink/10 px-3 py-1 text-annotation text-muted">{tag}</span>)}</div>}
          </div>
        </header>

        <div className="mx-6 border-t divider-gradient md:mx-10" />
        <div className="grid md:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
          <aside aria-label="书籍资料" className="min-w-0 px-6 py-8 md:px-10 md:py-10">
            <h2 className="mb-6 text-annotation uppercase tracking-[0.22em] text-muted">Book details / 书籍资料</h2>
            {sections.metadataHtml ? <ImageContent className="md-content reading-book-metadata" html={sections.metadataHtml} /> : (
              <dl className="space-y-6 text-sm leading-relaxed">
                {[["分类", book.rawCategory ?? book.category], ["ISBN", book.isbn]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="mb-2 text-annotation text-muted">{label}</dt><dd>{value}</dd></div>)}
              </dl>
            )}
          </aside>
          <section aria-label="划线与笔记" className="min-w-0 border-t border-dashed border-ink/10 px-6 py-8 md:my-8 md:border-l md:border-t-0 md:px-10 md:py-2">
            {sections.notesHtml ? <ImageContent className="md-content reading-book-notes" html={sections.notesHtml} /> : <p className="text-sm text-muted">这本书还没有留下划线或笔记。</p>}
          </section>
        </div>
      </div>

      {all.length > 1 && <Link href={`/reading/${next.slug}${shelfQuery}`} className="group mx-6 mb-8 mt-6 flex items-center justify-between gap-6 border-t divider-gradient pt-6 md:mx-10">
        <div><p className="text-annotation uppercase tracking-[0.22em] text-muted">Next book</p><h2 className="mt-2 text-lg text-ink/80 transition-colors group-hover:text-accent">{next.title}</h2></div>
        <span className="silence-pill shrink-0 text-muted">Continue →</span>
      </Link>}
    </article>
    </BookDialog>
  );
}
