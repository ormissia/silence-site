"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { ReadingEntry } from "@/lib/reading";
import { CategoryTabs, type CategoryTab } from "@/components/layout/category-tabs";
import { BookCard } from "@/components/reading/book-card";

export function ReadingShelf({
  books,
  categories,
}: {
  books: ReadingEntry[];
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
        <div className="mt-16 grid grid-cols-3 gap-x-5 gap-y-10 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
          {filtered.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      )}
    </>
  );
}
