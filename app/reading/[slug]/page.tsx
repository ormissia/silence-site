import Link from "next/link";
import { notFound } from "next/navigation";
import { getReadingEntry, listReading } from "@/lib/reading";

export function generateStaticParams() {
  return listReading().map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const book = getReadingEntry(params.slug);
  return {
    title: book ? `${book.title} — SILENCE` : "Reading — SILENCE",
  };
}

export default function ReadingEntryPage({ params }: { params: { slug: string } }) {
  const book = getReadingEntry(params.slug);
  if (!book) notFound();

  const all = listReading();
  const idx = all.findIndex((e) => e.slug === book.slug);
  const next = all[(idx + 1) % all.length];

  return (
    <article className="mx-auto max-w-[1400px] px-6 pt-32 md:px-10 md:pt-40">
      {/* 书籍头部信息卡 */}
      <header className="grid grid-cols-12 gap-x-8 gap-y-10 border-b border-rule pb-16">
        {/* 封面 */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="relative mx-auto w-full max-w-[320px] overflow-hidden bg-ink/5 shadow-[0_12px_36px_rgba(0,0,0,0.5)] md:mx-0">
            {book.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.cover}
                alt={book.title}
                className="block h-auto w-full object-contain"
              />
            )}
          </div>
        </div>

        {/* 元数据 */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          <p className="eyebrow">Reading Notes</p>
          <h1 className="mt-3 font-sans text-display">{book.title}</h1>
          {book.author && (
            <p className="mt-3 font-sans text-lede italic text-ink/80">{book.author}</p>
          )}

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 font-sans text-sm md:grid-cols-3">
            {book.progress && (
              <Field label="Progress">{book.progress}</Field>
            )}
            {book.rating && (
              <Field label="Rating">{book.rating}</Field>
            )}
            {book.readingTime && (
              <Field label="Reading Time">{book.readingTime}</Field>
            )}
            {book.readingDate && (
              <Field label="Started">{book.readingDate}</Field>
            )}
            {book.lastReadDate && (
              <Field label="Last Read">{book.lastReadDate}</Field>
            )}
            {book.finishedDate && (
              <Field label="Finished">{book.finishedDate}</Field>
            )}
            {book.category && (
              <Field label="Category">{book.category}</Field>
            )}
            {book.totalWords && (
              <Field label="Total Words">{book.totalWords.toLocaleString()}</Field>
            )}
            {book.isbn && (
              <Field label="ISBN">{book.isbn}</Field>
            )}
          </dl>

          {book.tags && book.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {book.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center border border-rule px-3 py-1 font-sans text-xs uppercase tracking-[0.2em] text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 笔记正文 */}
      <section className="mx-auto mt-16 max-w-[1100px] md:mt-20">
        <div
          className="md-content mx-auto max-w-column"
          dangerouslySetInnerHTML={{ __html: book.bodyHtml }}
        />
      </section>

      {all.length > 1 && (
        <section className="mx-auto mt-32 max-w-[1400px]">
          <Link
            href={`/reading/${next.slug}`}
            className="group block border-t border-rule pt-8"
          >
            <p className="eyebrow">Next Book</p>
            <div className="mt-3 flex items-baseline justify-between gap-6">
              <h3 className="font-sans text-headline group-hover:text-accent">
                {next.title}
              </h3>
              <span className="hidden font-sans text-sm uppercase tracking-[0.18em] text-muted group-hover:text-accent md:inline">
                Continue →
              </span>
            </div>
          </Link>
        </section>
      )}
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.18em] text-muted">{label}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}
