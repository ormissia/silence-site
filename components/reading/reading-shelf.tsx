"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { ReadingEntry } from "@/lib/reading";

export function ReadingShelf({
  books,
  categories,
}: {
  books: ReadingEntry[];
  categories: Array<{ name: string; count: number }>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("cat") ?? "all";

  const filtered = useMemo(
    () => (active === "all" ? books : books.filter((b) => b.category === active)),
    [books, active]
  );

  const onClick = (cat: string) => {
    const next = cat === "all" ? "/reading" : `/reading?cat=${encodeURIComponent(cat)}`;
    router.replace(next, { scroll: false });
  };

  return (
    <>
      {/* 分类 Tab：按书数倒序，"全部"在最前；横向可滚 */}
      <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-rule/60 pb-4">
        <CategoryTab
          label="全部"
          isActive={active === "all"}
          onClick={() => onClick("all")}
        />
        {categories.map((cat) => (
          <CategoryTab
            key={cat.name}
            label={cat.name}
            count={cat.count}
            isActive={active === cat.name}
            onClick={() => onClick(cat.name)}
          />
        ))}
        <span className="ml-auto font-sans text-xs uppercase tracking-[0.24em] text-muted">
          {filtered.length} {filtered.length > 1 ? "Books" : "Book"}
        </span>
      </div>

      {/* 书架 */}
      {filtered.length === 0 ? (
        <p className="mt-24 text-center font-sans text-muted">这个分类下还没有书。</p>
      ) : (
        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
                <h3 className="font-sans text-base leading-tight text-ink group-hover:text-accent">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="mt-1 font-sans text-xs text-muted">{book.author}</p>
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

function CategoryTab({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative inline-flex items-center gap-2 py-2 font-sans text-sm uppercase tracking-[0.18em] transition-colors duration-200 ${
        isActive ? "text-ink" : "text-muted hover:text-ink"
      }`}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={`font-sans text-[10px] tracking-[0.12em] ${
            isActive ? "text-accent" : "text-muted/70"
          }`}
        >
          {count}
        </span>
      )}
      <span
        className={`absolute -bottom-0.5 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-ink transition-[width] duration-300 ease-out ${
          isActive ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </button>
  );
}
