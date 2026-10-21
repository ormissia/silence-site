"use client";

import { RevealImg } from "@/components/media/reveal-image";

import { useEffect, useRef, useState } from "react";
import { ReturnToListLink } from "@/components/layout/list-return";

export function BookToolbar({ title, titleId, returnHref, returnLabel = "书架", cover, author, rating, readingTime }: {
  title: string;
  cover?: string;
  author?: string;
  rating?: string;
  readingTime?: string;
  titleId: string;
  returnHref: string;
  returnLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const toolbar = ref.current;
    const dialog = toolbar?.closest("dialog");
    const heading = document.getElementById(titleId);
    if (!toolbar || !dialog || !heading) return;

    let observer: IntersectionObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(([entry]) => {
        // Only pin a title that has passed above the toolbar, never one below the viewport.
        setShowTitle(!entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0));
      }, { root: dialog, rootMargin: `-${toolbar.getBoundingClientRect().height}px 0px 0px 0px`, threshold: 0 });
      observer.observe(heading);
    };
    const resize = new ResizeObserver(observe);
    resize.observe(toolbar);
    observe();
    return () => { resize.disconnect(); observer?.disconnect(); };
  }, [titleId]);

  return (
    <div ref={ref} className="sticky top-0 z-20 flex items-center gap-3 bg-surface-raised/95 px-4 py-3 backdrop-blur-md md:gap-6 md:px-10">
      <ReturnToListLink replace scroll={false} href={returnHref} aria-label={`返回${returnLabel}`} className="shrink-0 text-annotation uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink">
        <span className="hidden sm:inline">← Reading / 返回{returnLabel}</span><span className="inline-flex h-8 w-6 items-center justify-center text-base sm:hidden" aria-hidden>←</span>
      </ReturnToListLink>
      <div
        aria-hidden={!showTitle}
        data-book-sticky-title
        className={`flex min-h-14 min-w-0 flex-1 items-center gap-3 transition-opacity duration-200 motion-reduce:transition-none ${showTitle ? "opacity-100" : "invisible opacity-0"}`}
      >
        {cover && (
          <RevealImg src={cover} alt="" className="h-12 w-8 shrink-0 rounded-sm object-contain" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-6">
          <div className="min-w-0 flex-1">
            <p title={title} className="truncate text-sm font-medium text-ink/90">{title}</p>
            {author && <p title={author} className="mt-0.5 truncate text-[11px] leading-snug text-muted">{author}</p>}
          </div>
          {(rating || readingTime) && <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] leading-snug text-muted md:shrink-0 md:gap-x-5 md:text-xs">
            {rating && <span>评分 <span className="text-ink/80">{rating}</span></span>}
            {readingTime && <span>阅读 <span className="text-ink/80">{readingTime}</span></span>}
          </div>}
        </div>
      </div>
      <ReturnToListLink replace scroll={false} href={returnHref} aria-label={`关闭书籍详情，返回${returnLabel}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] text-muted transition-colors hover:bg-ink/10 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
        <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="m3 3 8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.2" /></svg>
      </ReturnToListLink>
    </div>
  );
}
