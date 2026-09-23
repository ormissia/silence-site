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
import { CoverFocusFrame } from "@/components/cover-focus-frame";
import { OverflowText } from "@/components/overflow-text";
import styles from "@/components/cover-hover.module.css";
import { rememberListPosition, RestoreListScroll } from "@/components/layout/list-return";

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
        <div className="space-y-6 pb-16 pt-2">
          {filtered.map((entry, i) => {
            const { day, monthYear } = formatDate(entry.date);
            return (
              <Link key={entry.slug} href={`/journal/${entry.slug}${categoryQuery}`} onClick={() => rememberListPosition(`/journal${categoryQuery}`)}
                className={`${styles.link} group grid overflow-hidden rounded-xl border border-white/10 bg-[#111] md:grid-cols-[200px_minmax(0,1fr)]`}>
                <div className="flex items-start justify-between gap-4 p-5 md:flex-col md:p-6">
                  <div className="shrink-0">
                    <span className="text-5xl font-light leading-none text-ink/85 md:text-7xl">{day}</span>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">{monthYear}</p>
                  </div>
                  <div className="text-right md:mt-auto md:text-left">
                    <p className="text-xs uppercase tracking-[0.12em] text-accent">{entry.category === "tech" ? "Tech / 技术" : "Life / 生活"}</p>
                    {entry.mood && <p className="mt-2 text-xs text-muted">Mood · {entry.mood}</p>}
                    {entry.location && <p className="mt-2 text-xs text-muted">{entry.location}</p>}
                  </div>
                </div>
                <div className={`${styles.cover} relative aspect-[16/9] min-w-0 bg-[#1b1b22] md:aspect-[5/2]`}>
                  {entry.cover ? <Image src={buildSrc(entry.cover, "detail")} alt="" fill sizes="(min-width: 768px) 70vw, 100vw" className={styles.image} /> : <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(124,108,240,0.14),transparent_42%),linear-gradient(135deg,rgba(201,153,74,0.12),transparent_55%)]" />}
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <span className="absolute left-5 top-5 text-xs tracking-[0.2em] text-white/75 md:left-7 md:top-7">{String(i + 1).padStart(2, "0")}</span>
                  {entry.cover && <CoverFocusFrame />}
                  <div className={`absolute inset-x-5 z-10 md:inset-x-7 ${entry.cover ? "bottom-5 md:bottom-7" : "top-1/2 -translate-y-1/2"}`}>
                    <h2 className="font-serif text-xl leading-snug text-white md:text-3xl"><OverflowText text={entry.title} /></h2>
                    {entry.excerpt && <p className="mt-2 text-sm leading-relaxed text-white/75"><OverflowText text={entry.excerpt} /></p>}
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
