"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { RevealImg } from "@/components/media/reveal-image";
import type { ReadingEntry } from "@/lib/reading";

/** 超出宽度的单行文字在背面显示时左右往返，保留完整内容。 */
function ScrollingText({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const row = ref.current;
    const text = row?.firstElementChild;
    if (!row || !text) return;
    const measure = () => setDistance(Math.max(0, text.scrollWidth - row.clientWidth));
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    observer.observe(text);
    measure();
    return () => observer.disconnect();
  }, [children]);

  return (
    <span ref={ref} className="reading-book-text" data-scroll={distance > 0}
      style={{ "--text-pan-distance": `${-distance}px`, "--text-pan-duration": `${Math.max(4, distance / 20 + 2)}s` } as CSSProperties}>
      <span>{children}</span>
    </span>
  );
}

/** 正面为书封，悬浮或键盘聚焦时翻到资料面；触屏使用独立翻面按钮。 */
export function BookCard({ book, index }: { book: ReadingEntry; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const category = useSearchParams().get("cat");
  const shelfQuery = category && category !== "all" ? `?cat=${encodeURIComponent(category)}` : "";

  return (
    <div className="reading-book relative min-w-0" data-flipped={flipped}>
      <Link
        href={`/reading/${book.slug}${shelfQuery}`}
        className="reading-book-link block aspect-[2/3]"
        aria-label={`查看《${book.title}》的读书笔记`}
        onBlur={() => setFlipped(false)}
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

          <div className="reading-book-face reading-book-back absolute inset-0 flex flex-col overflow-hidden border border-ink/10 bg-surface-raised p-2 font-sans">
            <h3 className="text-lede leading-snug tracking-normal text-ink"><ScrollingText>{book.title}</ScrollingText></h3>
            <p className="mt-1 break-words text-annotation leading-tight tracking-normal text-muted">{book.author ?? "作者未录入"}</p>
            <dl className="mt-auto space-y-1.5 whitespace-nowrap pt-2 text-annotation tracking-normal">
              <div>
                <dt className="text-muted">读完日期</dt>
                <dd className="mt-1 text-ink">
                  {book.finishedDate ? <time dateTime={book.finishedDate}>{book.finishedDate}</time> : "未记录"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-1 border-t border-ink/10 pt-1.5">
                <dt className="text-muted">笔记数量</dt>
                <dd className="shrink-0 text-annotation tracking-normal text-ink">
                  {book.noteCount === undefined ? "未统计" : `${book.noteCount} 条`}
                </dd>
              </div>
            </dl>
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
