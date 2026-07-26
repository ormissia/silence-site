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
        <div className="mt-16 flex flex-col">
          {filtered.map((entry, i) => {
            const { day, monthYear } = formatDate(entry.date);
            return (
              <Link
                key={entry.slug}
                href={`/journal/${entry.slug}`}
                className={`group grid grid-cols-12 gap-x-8 gap-y-6 py-12 transition-colors md:py-16 ${
                  i > 0 ? "border-t border-rule/60" : ""
                }`}
              >
                <div className="col-span-12 md:col-span-3">
                  <div className="flex items-baseline gap-3 md:flex-col md:items-start md:gap-1">
                    <span className="font-sans text-6xl leading-none text-ink md:text-7xl">
                      {day}
                    </span>
                    <span className="eyebrow">{monthYear}</span>
                  </div>
                  {entry.mood && (
                    <span className="mt-4 inline-flex items-center justify-center rounded-md border border-rule px-3 py-1 font-sans text-label uppercase tracking-[0.24em] text-muted">
                      Mood · {entry.mood}
                    </span>
                  )}
                  {entry.location && (
                    <p className="mt-3 font-sans text-label uppercase tracking-[0.18em] text-muted">
                      {entry.location}
                    </p>
                  )}
                </div>

                <div className="col-span-12 md:col-span-9">
                  {entry.cover && (
                    <div className="relative mb-6 aspect-[3/2] overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
                      <Image
                        src={buildSrc(entry.cover, "detail")}
                        alt={entry.title}
                        fill
                        className="cinema-tone-soft object-cover transition duration-700 ease-out group-hover:scale-[1.02]"
                        sizes="(min-width: 768px) 66vw, 100vw"
                      />
                    </div>
                  )}
                  <span className="eyebrow">
                    {entry.category === "tech" ? "Tech / 技术" : "Life / 生活"}
                  </span>
                  <h2 className="mt-2 font-serif text-headline group-hover:text-accent">
                    {entry.title}
                  </h2>
                  {entry.excerpt && (
                    <p className="mt-3 max-w-column font-sans text-lede text-ink/80">
                      {entry.excerpt}
                    </p>
                  )}
                  <span className="mt-4 inline-block font-sans text-label uppercase tracking-[0.18em] text-muted group-hover:text-accent">
                    Read note →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
