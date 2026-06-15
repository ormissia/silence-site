"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { ReadingEntry } from "@/lib/reading";
import { CategoryTabs, type CategoryTab } from "@/components/layout/category-tabs";

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
            <Link key={book.slug} href={`/reading/${book.slug}`} className="group block">
              <div className="relative w-full overflow-hidden bg-ink/5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                {book.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="block h-auto w-full object-contain transition duration-500 ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex aspect-[3/4] w-full items-center justify-center font-sans text-xs uppercase tracking-[0.24em] text-muted">
                    No Cover
                  </div>
                )}
                {book.progress && (
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 font-sans text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                    {book.progress}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <h3 className="font-sans text-sm leading-tight text-ink group-hover:text-accent">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="mt-1 font-sans text-[11px] text-muted">{book.author}</p>
                )}
                {(book.finishedDate ?? book.lastReadDate) && (
                  <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.18em] text-muted">
                    {book.finishedDate ?? book.lastReadDate}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
