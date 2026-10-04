"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { ReadingSummary } from "@/lib/reading/types";
import { groupReadingByYear } from "@/lib/reading-years";
import { CategoryTabs, type CategoryTab } from "@/components/layout/category-tabs";
import { BookCard } from "@/components/reading/book-card";
import { YearStatistics } from "@/components/reading/year-statistics";

export function ReadingShelf({
  books,
  categories,
}: {
  books: ReadingSummary[];
  categories: Array<{ name: string; count: number }>;
}) {
  const params = useSearchParams();
  const active = params.get("cat") ?? "all";

  const filtered = useMemo(
    () => (active === "all" ? books : books.filter((b) => b.category === active)),
    [books, active]
  );

  const tabs: CategoryTab[] = [
    { slug: "all", label: "全部", count: books.length },
    ...categories.map((c) => ({ slug: c.name, label: c.name, count: c.count })),
  ];

  const yearGroups = useMemo(() => groupReadingByYear(filtered), [filtered]);

  const totalLabel = `${filtered.length} ${filtered.length > 1 ? "Books" : "Book"}`;

  return (
    <>
      <CategoryTabs
        tabs={tabs}
        paramName="cat"
        basePath="/reading"
        totalLabel={totalLabel}
      />

      {/* 书架 */}
      {filtered.length === 0 ? (
        <p className="mt-24 text-center font-sans text-muted">这个分类下还没有书。</p>
      ) : (
        <div className="reading-years mt-8 sm:mt-12">
          {yearGroups.map(({ year, books: yearBooks }, groupIndex) => (
            <section key={year ?? "undated"} className="reading-year-section" aria-labelledby={`reading-year-${year ?? "undated"}`}>
              <header className="reading-year-summary">
                <h2 id={`reading-year-${year ?? "undated"}`} className={year ? "font-serif text-[clamp(2.5rem,4vw,3.5rem)] leading-none" : "text-xl font-medium leading-snug"}>
                  {year ?? "未记录读完日期"}
                </h2>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mt-5 hidden h-5 w-5 text-muted md:block">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.5c-2.5-2-6-2-9-1v14c3-1 6.5-1 9 1 2.5-2 6-2 9-1v-14c-3-1-6.5-1-9 1Zm0 0v14" />
                </svg>
                <p className="mt-3 text-annotation tracking-normal text-muted md:mt-5">
                  {year ? "这一年，读过的书。" : "保留书籍，等待补全读完时间。"}
                </p>
                <p className="reading-year-count font-sans text-label font-medium tracking-normal">
                  {yearBooks.length} {yearBooks.length === 1 ? "Book" : "Books"}
                </p>
                <YearStatistics books={yearBooks} categories={categories.map((category) => category.name)} />
              </header>
              <div className="reading-year-content min-w-0">
                <p className="mb-5 text-annotation uppercase tracking-[0.16em] text-muted">
                  {year ? `${year} Reading · 最近读完在前` : "Reading · 日期未记录"}
                </p>
                <div className="reading-shelf-grid reading-year-books">
                  {yearBooks.map((book, index) => (
                    <BookCard key={book.slug} book={book} index={groupIndex === 0 ? index : index + 4} />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
