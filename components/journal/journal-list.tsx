"use client";

import { RevealImage as Image } from "@/components/media/reveal-image";
import { useSearchParams } from "next/navigation";
import { buildSrc } from "@/lib/oss";
import type { JournalSummary } from "@/lib/journal/types";
import {
  JOURNAL_CATEGORIES,
  JOURNAL_CATEGORY_LABELS,
  type JournalCategory,
} from "@/lib/journal-categories";
import { CategoryTabs, type CategoryTab } from "@/components/layout/category-tabs";
import { CoverFocusFrame } from "@/components/cover-focus-frame";
import styles from "@/components/cover-hover.module.css";
import { EnterListLink, RestoreListScroll } from "@/components/layout/list-return";

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

export function JournalList({ entries }: { entries: JournalSummary[] }) {
  const params = useSearchParams();
  const cat = (params.get("cat") ?? "all") as "all" | JournalCategory;
  const categoryQuery = cat === "all" ? "" : `?cat=${encodeURIComponent(cat)}`;

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
      <RestoreListScroll />
      <CategoryTabs
        tabs={tabs}
        paramName="cat"
        basePath="/journal"
        totalLabel={totalLabel}
      />

      {filtered.length === 0 ? (
        <p className="mt-24 text-center font-sans text-muted">这个分类下还没有文章。</p>
      ) : (
        <div className="space-y-12 pb-16 pt-2 md:space-y-16">
          {filtered.map((entry, i) => {
            const { day, monthYear } = formatDate(entry.date);
            return (
              <EnterListLink key={entry.slug} href={`/journal/${entry.slug}${categoryQuery}`} listHref={`/journal${categoryQuery}`}
                className={`${styles.link} group grid gap-5 border-t border-rule pt-6 md:grid-cols-[128px_minmax(0,1fr)] md:gap-10 md:pt-8`}>
                <div className="flex items-start justify-between gap-4 md:flex-col md:justify-start">
                  <div className="shrink-0">
                    <span className="text-2xl font-light leading-none text-ink/85 md:text-3xl">{day}</span>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">{monthYear}</p>
                  </div>
                  <div className="text-right md:text-left">
                    <p className="text-xs uppercase tracking-[0.12em] text-accent">{entry.category === "tech" ? "Tech / 技术" : "Life / 生活"}</p>
                    {entry.mood && <p className="mt-2 text-xs text-muted">Mood · {entry.mood}</p>}
                    {entry.location && <p className="mt-2 text-xs text-muted">{entry.location}</p>}
                  </div>
                </div>
                <div className="min-w-0">
                  {entry.cover && <div className={`${styles.cover} image-frame relative mb-5 aspect-[16/9] md:aspect-[5/2]`}>
                    <Image revealIndex={i} src={buildSrc(entry.cover, "detail")} alt="" fill sizes="(min-width: 768px) 70vw, 100vw" className={styles.image} />
                    <CoverFocusFrame />
                  </div>}
                  <h2 className="font-serif text-xl leading-relaxed text-ink group-hover:text-accent md:text-2xl">{entry.title}</h2>
                  {entry.excerpt && <p className="mt-3 line-clamp-3 max-w-prose text-base leading-relaxed text-muted">{entry.excerpt}</p>}
                </div>
              </EnterListLink>
            );
          })}
        </div>
      )}
    </>
  );
}
