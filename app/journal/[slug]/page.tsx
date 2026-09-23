import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildSrc } from "@/lib/oss";
import { getJournalEntry, listJournal, JOURNAL_CATEGORY_LABELS } from "@/lib/journal";
import { ReturnToListLink } from "@/components/layout/list-return";

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

export default function JournalEntryPage({ params, searchParams }: {
  params: { slug: string };
  searchParams: { cat?: string | string[] };
}) {
  const entry = getJournalEntry(params.slug);
  if (!entry) notFound();

  const category = searchParams.cat === entry.category ? entry.category : undefined;
  const query = category ? `?cat=${encodeURIComponent(category)}` : "";
  // 优先同分类；若分类只有这一篇，则接到全站下一篇。
  const sameCat = listJournal(entry.category);
  const all = listJournal();
  const pool = sameCat.length > 1 ? sameCat : all;
  const idx = pool.findIndex((e) => e.slug === entry.slug);
  const next = pool.length > 1 ? pool[(idx + 1) % pool.length] : undefined;
  const nextQuery = next?.category === entry.category ? query : "";
  const catLabel = JOURNAL_CATEGORY_LABELS[entry.category];

  return (
    <article className="detail-enter">
      {entry.cover ? (
        // 有封面：标题压在 hero 底部居中，参考 works 详情页
        <header className="relative h-[70svh] min-h-[420px] max-h-[720px] w-full overflow-hidden bg-ink/5">
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
          <ReturnToListLink href={`/journal${query}`} className="silence-pill absolute left-6 top-[calc(var(--site-header-height)+1.5rem)] z-20 bg-black/40 text-white backdrop-blur-sm md:left-12">← Journal</ReturnToListLink>

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
        <header className="mx-auto max-w-[1100px] px-6 pt-[calc(var(--site-header-height)+2rem)] text-center md:px-10">
          <ReturnToListLink href={`/journal${query}`} className="silence-pill mb-10 text-muted">← Journal</ReturnToListLink>
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

      <section className="mx-auto mt-12 max-w-[1100px] px-6 md:mt-16 md:px-10">
        <div
          className="md-content mx-auto max-w-column border-t border-rule pt-12"
          dangerouslySetInnerHTML={{ __html: entry.bodyHtml }}
        />
      </section>

      {next && <section className="mx-auto mt-32 max-w-[1400px] px-6 md:px-10">
        <Link
          href={`/journal/${next.slug}${nextQuery}`}
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
      </section>}
    </article>
  );
}
