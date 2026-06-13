import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildSrc } from "@/lib/oss";
import { getJournalEntry, listJournal, JOURNAL_CATEGORY_LABELS } from "@/lib/journal";

export function generateStaticParams() {
  return listJournal().map((e) => ({ slug: e.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const entry = getJournalEntry(params.slug);
  return {
    title: entry ? `${entry.title} — SILENCE` : "Journal — SILENCE",
  };
}

const MONTH_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTH_EN[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

export default function JournalEntryPage({ params }: { params: { slug: string } }) {
  const entry = getJournalEntry(params.slug);
  if (!entry) notFound();

  // 同分类内取下一篇，没有则全集循环
  const sameCat = listJournal(entry.category);
  const idx = sameCat.findIndex((e) => e.slug === entry.slug);
  const next = sameCat[(idx + 1) % sameCat.length];
  const catLabel = JOURNAL_CATEGORY_LABELS[entry.category];

  return (
    <article>
      {entry.cover && (
        <div className="relative">
          <div className="vignette relative aspect-[16/9] w-full overflow-hidden bg-ink/5">
            <Image
              src={buildSrc(entry.cover, "hero")}
              alt={entry.title}
              fill
              priority
              className="cinema-tone-soft object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      )}

      <header className="mx-auto mt-16 max-w-[1100px] px-6 text-center md:mt-24 md:px-10">
        <p className="eyebrow">
          {[
            `${catLabel.en} / ${catLabel.zh}`,
            formatDateLong(entry.date),
            entry.location,
          ]
            .filter(Boolean)
            .join(" — ")}
        </p>
        <h1 className="mt-6 font-sans text-display">{entry.title}</h1>
        {entry.excerpt && (
          <p className="mx-auto mt-8 max-w-column font-sans text-lede italic text-ink/80">
            {entry.excerpt}
          </p>
        )}
      </header>

      <section className="mx-auto mt-20 max-w-[1100px] px-6 md:px-10">
        <div
          className="md-content mx-auto max-w-column border-t border-rule pt-12"
          dangerouslySetInnerHTML={{ __html: entry.bodyHtml }}
        />
      </section>

      <section className="mx-auto mt-32 max-w-[1400px] px-6 md:px-10">
        <Link
          href={`/journal/${next.slug}`}
          className="group block border-t border-rule pt-8"
        >
          <p className="eyebrow">Next Note</p>
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
    </article>
  );
}
