"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buildSrc } from "@/lib/oss";
import type { JournalEntry } from "@/lib/journal";
import {
  JOURNAL_CATEGORIES,
  JOURNAL_CATEGORY_LABELS,
  type JournalCategory,
} from "@/lib/journal-categories";
import { CategoryTabs, type CategoryTab } from "@/components/layout/category-tabs";

const MONTH_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(iso: string): { day: string; monthYear: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "—", monthYear: "" };
  return {
    day: String(d.getDate()).padStart(2, "0"),
    monthYear: `${MONTH_EN[d.getMonth()]} ${d.getFullYear()}`,
  };
}

export function JournalList({ entries }: { entries: JournalEntry[] }) {
  const params = useSearchParams();
  const cat = (params.get("cat") ?? "all") as "all" | JournalCategory;

  const filtered = cat === "all" ? entries : entries.filter((e) => e.category === cat);

  // tabs：全部 + 各 category，每项后跟数量
  const tabs: CategoryTab[] = [
    { slug: "all", label: "全部", count: entries.length },
    ...JOURNAL_CATEGORIES.map((c) => ({
      slug: c,
      label: JOURNAL_CATEGORY_LABELS[c].zh,
      count: entries.filter((e) => e.category === c).length,
    })),
  ];

  const totalLabel = `${filtered.length} ${filtered.length > 1 ? "Notes" : "Note"}`;

  return (
    <>
      <CategoryTabs
        tabs={tabs}
        paramName="cat"
        basePath="/journal"
        totalLabel={totalLabel}
      />

      {filtered.length === 0 ? (
        <p className="mt-24 text-center font-sans text-muted">这个分类下还没有文章。</p>
      ) : (
        <div className="flex snap-x snap-proximity gap-5 overflow-x-auto pb-16 pt-2">
          {filtered.map((entry, i) => {
            const { day, monthYear } = formatDate(entry.date);
            return (
              <Link key={entry.slug} href={`/journal/${entry.slug}`}
                className="group flex w-[85vw] max-w-[900px] shrink-0 snap-start flex-col gap-5 md:w-[78vw] md:flex-row">
                <div className="editorial-card flex flex-col justify-between p-6 md:w-[220px] md:shrink-0">
                  <div>
                    <span className="text-7xl font-light leading-none text-ink/85">{day}</span>
                    <p className="mt-3 text-caption uppercase tracking-[0.22em] text-muted">{monthYear}</p>
                    {entry.mood && <span className="silence-pill mt-4 text-muted">Mood · {entry.mood}</span>}
                    {entry.location && <p className="mt-4 text-annotation uppercase tracking-widest text-muted">{entry.location}</p>}
                  </div>
                  <div className="mt-8 border-t border-white/10 pt-4">
                    <p className="text-annotation uppercase tracking-widest text-accent">{entry.category === "tech" ? "Tech / 技术" : "Life / 生活"}</p>
                    <h2 className="mt-2 font-serif text-sm leading-relaxed">{entry.title}</h2>
                  </div>
                </div>
                <div className="editorial-card min-w-0 flex-1">
                  <div className="relative aspect-video overflow-hidden bg-ink/5">
                    {entry.cover ? <Image src={buildSrc(entry.cover, "detail")} alt={entry.title} fill sizes="(min-width: 768px) 50vw, 85vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center font-serif text-4xl italic text-muted/40">Notes & essays</div>}
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute left-5 top-5 text-caption text-white/60">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 px-5 py-4">
                    <div><p className="font-serif text-sm italic">{entry.title}</p>{entry.excerpt && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{entry.excerpt}</p>}</div>
                    <span className="silence-pill shrink-0 text-muted">View →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
