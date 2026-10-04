"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { rememberListPosition, RestoreListScroll } from "@/components/layout/list-return";
import { BookCoverBackground, BookInformation } from "./book-information";
import { EvolutionYearGraph } from "./evolution-year-graph";
import { EVOLUTION_HEADER_HEIGHT, EVOLUTION_WIDTH, EVOLUTION_YEAR_GAP, readingEvolution, type EvolutionBook, type EvolutionNode } from "@/lib/reading-evolution";

const RETURN_HREF = "/reading/evolution";
const bookHref = (book: EvolutionBook) => `/reading/${book.slug}?view=evolution`;

export function ReadingEvolution({ books }: { books: EvolutionBook[] }) {
  const reduceMotion = useReducedMotion();
  const [plotScale, setPlotScale] = useState(1);
  const model = useMemo(() => readingEvolution(books, EVOLUTION_YEAR_GAP * plotScale), [books, plotScale]);
  const [active, setActive] = useState<EvolutionNode | null>(null);
  const [displayed, setDisplayed] = useState<EvolutionNode | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipOffset, setTooltipOffset] = useState(18);
  const tooltipId = useId();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<EvolutionNode | null>(null);
  const activeSource = useRef<"pointer" | "focus" | null>(null);
  const plotHeight = model.height - EVOLUTION_HEADER_HEIGHT;
  useLayoutEffect(() => {
    if (active) {
      setDisplayed(active);
      // Reuse an exiting popup so rapid re-entry continues from its current opacity.
      if (tooltipRef.current || reduceMotion) { setTooltipVisible(true); return; }
      setTooltipVisible(false);
      let nextFrame = 0;
      const frame = requestAnimationFrame(() => {
        nextFrame = requestAnimationFrame(() => setTooltipVisible(true));
      });
      return () => { cancelAnimationFrame(frame); cancelAnimationFrame(nextFrame); };
    }
    setTooltipVisible(false);
    if (reduceMotion) { setDisplayed(null); return; }
    if (!tooltipRef.current) return;
    const timeout = window.setTimeout(() => setDisplayed(null), 140);
    return () => window.clearTimeout(timeout);
  }, [active, reduceMotion]);
  useEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;
    let previousWidth = 0;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width <= 0 || width === previousWidth) return;
      previousWidth = width;
      // Compensate the SVG viewBox scale once on resize; category expansion does not change it.
      const scale = EVOLUTION_WIDTH / width;
      plot.style.setProperty("--reading-evolution-label-scale", String(scale));
      setPlotScale(scale);
      activeRef.current = null;
      activeSource.current = null;
      setActive(null);
    });
    observer.observe(plot);
    return () => observer.disconnect();
  }, [model.datedCount]);
  const remember = () => rememberListPosition(RETURN_HREF);
  const activate = (node: EvolutionNode, target: Element, source: "pointer" | "focus") => {
    if (source === "pointer" && activeSource.current === "focus") return;
    const rect = target.getBoundingClientRect();
    const center = (rect.top + rect.bottom) / 2;
    const plot = target.closest(".reading-evolution-plot")!;
    const columns = Number(getComputedStyle(plot).getPropertyValue("--reading-columns"));
    const height = ((plot.getBoundingClientRect().width + 20) / columns - 20) * 1.5;
    const preferredTop = rect.top < height + 112 ? center + 18 : center - height - 18;
    const top = Math.max(112, Math.min(preferredTop, window.innerHeight - height - 16));
    activeRef.current = node;
    activeSource.current = source;
    setActive(node);
    setTooltipOffset(top - center);
  };

  const deactivate = (source: "pointer" | "focus", slug?: string) => {
    if (source === "pointer" && activeSource.current === "focus") return;
    if (slug && activeRef.current?.book.slug !== slug) return;
    activeRef.current = null;
    activeSource.current = null;
    setActive(null);
  };
  const updatePositions = (nodes: EvolutionNode[], xs: number[]) => {
    const selected = activeRef.current;
    if (!selected || !tooltipRef.current) return;
    const index = nodes.findIndex((node) => node.book.slug === selected.book.slug);
    if (index < 0) return;
    tooltipRef.current.style.left = `clamp(calc(var(--reading-cover-width) / 2), ${xs[index] / EVOLUTION_WIDTH * 100}%, calc(100% - var(--reading-cover-width) / 2))`;
  };

  return (
    <>
      <RestoreListScroll />
      {model.datedCount === 0 && <p className="py-16 text-center text-sm text-muted">记录读完日期后，阅读轨迹会出现在这里。</p>}
      {model.datedCount > 0 && <div className="hidden md:block">
        <div ref={plotRef} className="reading-evolution-plot relative">
        <svg viewBox={`0 ${EVOLUTION_HEADER_HEIGHT} ${EVOLUTION_WIDTH} ${plotHeight}`} className="block h-auto w-full text-ink" role="group" aria-label="按年份与书籍分类排列的阅读轨迹">
          <desc>纵向按读完日期由晚到早，每年只展示有书籍的原始分类，悬停分类区域展开列宽。圆点大小表示阅读时长，连线连接同年相邻读完的书。悬停或聚焦圆点查看信息，点击打开书籍笔记。</desc>
          {model.years.map((year) => <EvolutionYearGraph key={year.year} year={year}
            activeSlug={active?.book.slug} tooltipId={tooltipId} onActivate={activate} onDeactivate={deactivate}
            onPositions={updatePositions} onBookClick={remember} />)}
          <line aria-hidden="true" x1="0" y1={model.height} x2={EVOLUTION_WIDTH} y2={model.height} stroke="currentColor" strokeOpacity="0.1" />
        </svg>
        {displayed && <div ref={tooltipRef} id={tooltipId} role="tooltip" data-visible={tooltipVisible}
          className="reading-evolution-tooltip pointer-events-none absolute z-10 isolate aspect-[2/3] max-w-full -translate-x-1/2 overflow-hidden border border-ink/15 bg-surface-raised text-ink shadow-lg"
          style={{ left: `clamp(calc(var(--reading-cover-width) / 2), ${displayed.x / EVOLUTION_WIDTH * 100}%, calc(100% - var(--reading-cover-width) / 2))`, top: `calc(${(displayed.y - EVOLUTION_HEADER_HEIGHT) / plotHeight * 100}% + ${tooltipOffset}px)` }}>
          <BookInformation book={displayed.book} />
        </div>}
        </div>
      </div>}
      <div className="md:hidden">
        {model.years.map(({ year, nodes }) => <section key={year} aria-labelledby={`evolution-year-${year}`} className="border-t border-rule py-8">
          <header className="mb-6 flex items-baseline justify-between gap-4">
            <h2 id={`evolution-year-${year}`} className="font-serif text-4xl">{year}</h2>
            <p className="text-annotation text-muted">{nodes.length} 本</p>
          </header>
          <ol className="ml-2 border-l border-ink/15">
            {nodes.map(({ book, radius }) => <li key={book.slug} className="relative pl-6">
              <span aria-hidden="true" className="absolute left-0 top-6 -translate-x-1/2 rounded-full border-2 border-paper bg-ink/60" style={{ width: radius * 1.4 + 4, height: radius * 1.4 + 4 }} />
              <Link href={bookHref(book)} prefetch={false} scroll={false} onClick={remember} className="relative isolate my-3 block overflow-hidden rounded-xl border border-ink/10 bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">
                <BookCoverBackground cover={book.cover} />
                <div className="relative z-10 min-h-[180px] p-4">
                <div className="flex flex-wrap items-center gap-2 text-[10px] tracking-wide text-ink/80">
                  <time dateTime={book.finishedDate}>{book.finishedDate}</time>
                  <span className="silence-pill !px-2 !py-1 !text-[10px] !tracking-normal">{book.category}</span>
                </div>
                <h3 className="mt-2 break-words font-serif text-lg leading-snug">{book.title}</h3>
                {book.author && <p className="mt-1 break-words text-xs leading-relaxed text-ink/80">{book.author}</p>}
                <p className="mt-2 break-words text-[11px] text-ink/80">{book.readingTime ?? "时长未记录"} · {book.noteCount === undefined ? "笔记数量未记录" : `${book.noteCount} 条笔记`}</p>
                </div>
              </Link>
            </li>)}
          </ol>
        </section>)}
      </div>
      <p className="hidden py-6 text-center text-annotation tracking-normal text-muted md:block">沿着连线，看看阅读如何在不同分类间流动。悬停查看，点击圆点打开笔记。</p>
      {model.undated.length > 0 && <details className="mt-8 border-t border-rule pt-6">
        <summary className="w-fit cursor-pointer text-sm text-muted">未记录读完日期 · {model.undated.length} 本</summary>
        <p className="mt-4 text-xs leading-relaxed text-muted">这些书暂未放入时间轨迹，补全读完日期后会归入对应年度。</p>
        <ul className="mt-5 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {model.undated.map((book) => <li key={book.slug} className="min-w-0 border-b border-rule py-4">
            <Link href={bookHref(book)} prefetch={false} scroll={false} onClick={remember} className="block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">
              <p className="break-words font-serif text-sm leading-relaxed">{book.title}</p>
              <p className="mt-1 break-words text-xs leading-relaxed text-muted">{book.author ?? "作者未记录"} · {book.category}</p>
            </Link>
          </li>)}
        </ul>
      </details>}
    </>
  );
}
