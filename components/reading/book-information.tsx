"use client";

import { useEffect, useRef, useState } from "react";
import { RevealImg } from "@/components/media/reveal-image";
import type { ReadingEntry } from "@/lib/reading";

type InformationBook = Pick<ReadingEntry, "title" | "author" | "cover" | "category" | "finishedDate" | "readingTime" | "noteCount">;

/** 作者按剩余高度换行；仅在资料面显示时测量，不产生滚动。 */
function BookAuthor({ author, active }: { author: string; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState(2);

  useEffect(() => {
    if (!active) return;
    const area = ref.current;
    const text = area?.firstElementChild;
    if (!area || !text) return;
    const fit = () => {
      const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
      setLines(Math.max(1, Math.floor(area.clientHeight / lineHeight)));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(area);
    fit();
    return () => observer.disconnect();
  }, [active]);

  return <div ref={ref} className="mt-0.5 min-h-0 flex-1 overflow-hidden">
    <p className="line-clamp-2 break-words whitespace-normal text-annotation leading-tight tracking-normal text-ink/80" style={{ WebkitLineClamp: lines }}>{author}</p>
  </div>;
}

export function BookInformation({ book, active = true, titleAs = "p", coverBackground = true }: { book: InformationBook; active?: boolean; titleAs?: "h3" | "p"; coverBackground?: boolean }) {
  const Title = titleAs;
  return <>
    {coverBackground && <div aria-hidden="true" className="absolute inset-0">
      {book.cover && <RevealImg src={book.cover} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />}
      <div className="reading-book-info-mask absolute inset-0" />
    </div>}
    <div className="relative z-10 flex h-full flex-col justify-between gap-px p-1.5 font-sans">
      <div className="flex min-h-0 flex-1 flex-col">
        <Title className="line-clamp-3 shrink-0 break-words text-lede leading-snug tracking-normal">{book.title}</Title>
        <BookAuthor author={book.author ?? "作者未记录"} active={active} />
      </div>
      <dl className="shrink-0 border-t border-ink/20 pt-0.5 text-annotation leading-tight tracking-normal">
        {[["分类", book.category], ["读完", book.finishedDate ?? "未记录"], ["阅读", book.readingTime ?? "未记录"], ["笔记", book.noteCount === undefined ? "未记录" : `${book.noteCount} 条`]].map(([label, value]) =>
          <div key={label} className="flex justify-between gap-1"><dt className="shrink-0 text-ink/70">{label}</dt><dd className="text-right">{value}</dd></div>
        )}
      </dl>
    </div>
  </>;
}
