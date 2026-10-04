"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { RevealImg } from "@/components/media/reveal-image";
import { BookInformation } from "./book-information";
import type { ReadingSummary } from "@/lib/reading/types";

/** 正面为书封，悬浮或键盘聚焦时翻到资料面；触屏使用独立翻面按钮。 */
export function BookCard({ book, index }: { book: ReadingSummary; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const category = useSearchParams().get("cat");
  const shelfQuery = category && category !== "all" ? `?cat=${encodeURIComponent(category)}` : "";

  return (
    <div className="reading-book relative min-w-0" data-flipped={flipped}>
      <Link
        href={`/reading/${book.slug}${shelfQuery}`}
        className="reading-book-link block aspect-[2/3]"
        aria-label={`查看《${book.title}》的读书笔记`}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFlipped(false); setFocused(false); }}
      >
        <div className="reading-book-flipper relative h-full w-full">
          <div className="reading-book-face reading-book-front image-frame absolute inset-0 overflow-hidden" aria-hidden="true">
            {book.cover ? (
              <RevealImg
                revealIndex={index}
                src={book.cover}
                alt=""
                className="block h-full w-full object-cover"
                loading="lazy"
                draggable={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-5 text-center font-sans text-label text-muted">
                {book.title}
              </div>
            )}
            <span className="absolute right-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/65 px-2.5 py-1 font-sans text-annotation tracking-normal text-white backdrop-blur-sm sm:right-3 sm:top-3">
              {book.category}
            </span>
          </div>

          <div className="reading-book-face reading-book-back absolute inset-0 isolate overflow-hidden border border-ink/15 bg-surface-raised text-ink shadow-lg">
            <BookInformation book={book} active={hovered || focused || flipped} titleAs="h3" coverBackground={false} />
          </div>
        </div>
      </Link>
      <button
        type="button"
        className="reading-book-toggle absolute bottom-2 right-2 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 font-sans text-annotation tracking-normal text-white backdrop-blur-sm"
        aria-label={`${flipped ? "显示封面" : "查看书籍信息"}：${book.title}`}
        aria-pressed={flipped}
        onClick={() => setFlipped((value) => !value)}
      >
        {flipped ? "↶" : "信息 ↻"}
      </button>
    </div>
  );
}
