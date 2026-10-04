"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { rememberListPosition, RestoreListScroll } from "@/components/layout/list-return";
import { RevealImg } from "@/components/media/reveal-image";
import { EVOLUTION_AXIS, EVOLUTION_COLUMN, EVOLUTION_HEADER_HEIGHT, EVOLUTION_WIDTH, READING_GENRES, readingEvolution, type EvolutionBook, type EvolutionNode } from "@/lib/reading-evolution";

const RETURN_HREF = "/reading/evolution";
const bookHref = (book: EvolutionBook) => `/reading/${book.slug}?view=evolution`;
const description = (book: EvolutionBook) => `${book.title}；${book.author ?? "作者未记录"}；${book.finishedDate ?? "读完日期未记录"}；阅读 ${book.readingTime ?? "时长未记录"}；${book.noteCount === undefined ? "笔记数量未记录" : `${book.noteCount} 条笔记`}`;

export function ReadingEvolution({ books }: { books: EvolutionBook[] }) {
  const model = useMemo(() => readingEvolution(books), [books]);
  const [active, setActive] = useState<EvolutionNode | null>(null);
  const [tooltipOffset, setTooltipOffset] = useState(18);
  const tooltipId = useId();
  const plotHeight = model.height - EVOLUTION_HEADER_HEIGHT;
  const summary = <div className="space-y-1 pb-5 text-right text-annotation leading-relaxed tracking-normal text-muted">
    <p>{model.datedCount} 本书 · {model.years.length} 个年度 · 最近读完在前</p>
    <p>每个圆点是一本书 · 圆越大，阅读时间越长</p>
  </div>;
  const remember = () => rememberListPosition(RETURN_HREF);
  const activate = (node: EvolutionNode, target: Element) => {
    const rect = target.getBoundingClientRect();
    const center = (rect.top + rect.bottom) / 2;
    const plot = target.closest(".reading-evolution-plot")!;
    const columns = Number(getComputedStyle(plot).getPropertyValue("--reading-columns"));
    const height = ((plot.getBoundingClientRect().width + 20) / columns - 20) * 1.5;
    const preferredTop = rect.top < height + 112 ? center + 18 : center - height - 18;
    const top = Math.max(112, Math.min(preferredTop, window.innerHeight - height - 16));
    setActive(node);
    setTooltipOffset(top - center);
  };

  return (
    <>
      <RestoreListScroll />
      <div className="md:hidden">{summary}</div>
      {model.datedCount === 0 && <p className="py-16 text-center text-sm text-muted">记录读完日期后，阅读轨迹会出现在这里。</p>}
      {model.datedCount > 0 && <div className="hidden md:block">
        <div role="list" aria-label="阅读演化分类"
          className="pointer-events-none grid grid-cols-8 items-center justify-items-center pb-5 pt-1"
          style={{ marginLeft: `${EVOLUTION_AXIS / EVOLUTION_WIDTH * 100}%`, marginRight: `${24 / EVOLUTION_WIDTH * 100}%` }}>
          {READING_GENRES.map((genre) => <span key={genre.name} role="listitem"
            className="silence-pill silence-pill-nav whitespace-nowrap !px-2 font-sans uppercase lg:!px-[.9rem]">
            {genre.name}
          </span>)}
        </div>
        {summary}
        <div className="reading-evolution-plot relative">
        <svg viewBox={`0 ${EVOLUTION_HEADER_HEIGHT} ${EVOLUTION_WIDTH} ${plotHeight}`} className="block h-auto w-full text-ink" role="group" aria-label="按年份与书籍分类排列的阅读轨迹">
          <desc>纵向按读完日期由晚到早，横向按分类分列。圆点大小表示阅读时长，连线连接同年相邻读完的书。悬停或聚焦圆点查看信息，点击打开书籍笔记。</desc>
          {READING_GENRES.map((genre, index) => {
            const x = EVOLUTION_AXIS + (index + 0.5) * EVOLUTION_COLUMN;
            return <g key={genre.name} aria-hidden="true">
              <line x1={x} y1={EVOLUTION_HEADER_HEIGHT} x2={x} y2={model.height} stroke="currentColor" strokeOpacity="0.055" strokeDasharray="2 7" />
            </g>;
          })}
          {model.years.map(({ year, top, bottom, nodes }) => <g key={year}>
            <g aria-hidden="true">
              <line x1="0" y1={top} x2={EVOLUTION_WIDTH} y2={top} stroke="currentColor" strokeOpacity="0.1" />
              <text x="14" y={(top + bottom) / 2} fill="currentColor" className="font-serif text-[30px]">{year}</text>
              <text x="15" y={(top + bottom) / 2 + 23} fill="currentColor" opacity="0.45" className="font-sans text-[9px]">12月 — 1月 · {nodes.length} 本</text>
              {nodes.slice(1).map((node, index) => <line key={node.book.slug}
                x1={nodes[index].x} y1={nodes[index].y} x2={node.x} y2={node.y}
                stroke="currentColor" strokeOpacity="0.19" strokeWidth="1" pointerEvents="none" />)}
            </g>
            {nodes.map((node) => {
              const selected = active?.book.slug === node.book.slug;
              return <Link key={node.book.slug} href={bookHref(node.book)} prefetch={false} scroll={false} onClick={remember}
                aria-label={description(node.book)} aria-describedby={selected ? tooltipId : undefined}
                className="cursor-pointer outline-none"
                onPointerEnter={(event) => activate(node, event.currentTarget)}
                onPointerLeave={(event) => { if (document.activeElement !== event.currentTarget) setActive(null); }}
                onFocus={(event) => activate(node, event.currentTarget)} onBlur={() => setActive(null)}
                onKeyDown={(event) => { if (event.key === "Escape") setActive(null); }}>
                <circle cx={node.x} cy={node.y} r={node.radius + 5} fill="transparent" />
                <circle cx={node.x} cy={node.y} r={node.radius + 4} fill="none" stroke="currentColor" strokeOpacity={selected ? 0.7 : 0} pointerEvents="none" />
                <circle cx={node.x} cy={node.y} r={node.radius} fill="currentColor" fillOpacity={selected ? 0.95 : 0.56} stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.25" pointerEvents="none" />
              </Link>;
            })}
          </g>)}
          <line aria-hidden="true" x1="0" y1={model.height} x2={EVOLUTION_WIDTH} y2={model.height} stroke="currentColor" strokeOpacity="0.1" />
        </svg>
        {active && <div id={tooltipId} role="tooltip"
          className="reading-evolution-tooltip pointer-events-none absolute z-10 isolate aspect-[2/3] max-w-full -translate-x-1/2 overflow-hidden rounded-xl border border-ink/15 bg-surface-raised text-ink shadow-lg"
          style={{ left: `clamp(calc(var(--reading-cover-width) / 2), ${active.x / EVOLUTION_WIDTH * 100}%, calc(100% - var(--reading-cover-width) / 2))`, top: `calc(${(active.y - EVOLUTION_HEADER_HEIGHT) / plotHeight * 100}% + ${tooltipOffset}px)` }}>
          <div aria-hidden="true" className="absolute inset-0">
            {active.book.cover && <RevealImg src={active.book.cover} alt="" decoding="async" className="h-full w-full object-cover" />}
            <div className="reading-evolution-tooltip-mask absolute inset-0" />
          </div>
          <div className="relative z-10 flex h-full flex-col justify-between gap-px p-1.5 font-sans">
            <div>
              <p className="line-clamp-3 break-words text-lede leading-snug tracking-normal">{active.book.title}</p>
              <p className="mt-0.5 line-clamp-2 break-words text-annotation leading-tight tracking-normal text-ink/80">{active.book.author ?? "作者未记录"}</p>
            </div>
            <dl className="shrink-0 border-t border-ink/20 pt-0.5 text-annotation leading-tight tracking-normal">
              {[["分类", active.book.category], ["读完", active.book.finishedDate], ["阅读", active.book.readingTime ?? "未记录"], ["笔记", active.book.noteCount === undefined ? "未记录" : `${active.book.noteCount} 条`]].map(([label, value]) =>
                <div key={label} className="flex justify-between gap-1"><dt className="shrink-0 text-ink/70">{label}</dt><dd className="text-right">{value}</dd></div>
              )}
            </dl>
          </div>
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
            {nodes.map(({ book, genre, radius }) => <li key={book.slug} className="relative pl-6">
              <span aria-hidden="true" className="absolute left-0 top-6 -translate-x-1/2 rounded-full border-2 border-paper bg-ink/60" style={{ width: radius * 1.4 + 4, height: radius * 1.4 + 4 }} />
              <Link href={bookHref(book)} prefetch={false} scroll={false} onClick={remember} className="block rounded px-1 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">
                <div className="flex flex-wrap items-center gap-2 text-[10px] tracking-wide text-muted">
                  <time dateTime={book.finishedDate}>{book.finishedDate}</time>
                  <span className="silence-pill !px-2 !py-1 !text-[10px] !tracking-normal">{READING_GENRES[genre].name}</span>
                </div>
                <h3 className="mt-2 break-words font-serif text-lg leading-snug">{book.title}</h3>
                {book.author && <p className="mt-1 break-words text-xs leading-relaxed text-muted">{book.author}</p>}
                <p className="mt-2 text-[11px] text-muted">{book.readingTime ?? "时长未记录"} · {book.noteCount === undefined ? "笔记数量未记录" : `${book.noteCount} 条笔记`}</p>
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
