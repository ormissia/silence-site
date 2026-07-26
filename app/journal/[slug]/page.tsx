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
      {entry.cover ? (
        // 有封面：标题压在 hero 底部居中，参考 works 详情页
        <header className="relative h-screen min-h-[560px] w-full overflow-hidden bg-ink/5">
          <Image
            src={buildSrc(entry.cover, "hero")}
            alt={entry.title}
            fill
            priority
            className="cinema-tone-soft object-cover"
            sizes="100vw"
          />
          {/* 暗化让标题在亮区也立得住 */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/75"
          />
          <div className="vignette absolute inset-0" />

          <div className="relative z-10 mx-auto flex h-full max-w-[1100px] flex-col items-center justify-end px-6 pb-10 text-center md:px-10 md:pb-14">
            <p className="eyebrow text-white/80">
              {[
                `${catLabel.en} / ${catLabel.zh}`,
                formatDateLong(entry.date),
                entry.location,
              ]
                .filter(Boolean)
                .join(" — ")}
            </p>
            <h1 className="mt-4 font-sans text-display text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.5)]">
              {entry.title}
            </h1>
            {entry.excerpt && (
              <p className="mx-auto mt-6 max-w-column font-sans text-lede italic text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]">
                {entry.excerpt}
              </p>
            )}
          </div>
        </header>
      ) : (
        // 无封面：保留原有"标题居中、留白足"的排版
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
      )}

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
            <span className="hidden font-sans text-label uppercase tracking-[0.18em] text-muted group-hover:text-accent md:inline">
              Continue →
            </span>
          </div>
        </Link>
      </section>
    </article>
  );
}
