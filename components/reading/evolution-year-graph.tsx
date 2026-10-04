"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef } from "react";
import { EVOLUTION_WIDTH, evolutionLayout, type EvolutionLayout, type EvolutionNode, type EvolutionYear } from "@/lib/reading-evolution";

type Props = {
  year: EvolutionYear;
  activeSlug?: string;
  tooltipId: string;
  onActivate: (node: EvolutionNode, target: Element, source: "pointer" | "focus") => void;
  onDeactivate: (source: "pointer" | "focus") => void;
  onPositions: (nodes: EvolutionNode[], xs: number[]) => void;
  onBookClick: () => void;
};

/** One bounded animation per affected year; nodes and line endpoints share each frame's coordinates. */
export function EvolutionYearGraph({ year, activeSlug, tooltipId, onActivate, onDeactivate, onPositions, onBookClick }: Props) {
  const base = useMemo(() => evolutionLayout(year), [year]);
  const root = useRef<SVGGElement>(null);
  const current = useRef(base);
  const frame = useRef(0);
  const targetCategory = useRef<string | null>(null);
  const pointerCategory = useRef<string | null>(null);
  const focusCategory = useRef<string | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const hoveredSlug = useRef<string | null>(null);
  const elements = useRef<{ columns: SVGRectElement[]; labels: SVGTextElement[]; nodes: SVGGElement[]; circles: SVGCircleElement[][]; lines: SVGLineElement[] }>();
  const positionCallback = useRef(onPositions);
  positionCallback.current = onPositions;
  const activateCallback = useRef(onActivate);
  activateCallback.current = onActivate;

  const activatePointer = (target: Element | null) => {
    if (frame.current || focusCategory.current || !target || !root.current?.contains(target)) return;
    const link = target.closest("[data-book-index]");
    if (!link || link.getAttribute("data-reading-category") !== targetCategory.current) return;
    const index = Number(link.getAttribute("data-book-index"));
    const node = year.nodes[index];
    if (hoveredSlug.current === node.book.slug) return;
    hoveredSlug.current = node.book.slug;
    activateCallback.current({ ...node, x: current.current.xs[index] }, link, "pointer");
  };

  const restorePointer = () => {
    const point = pointer.current;
    if (point) activatePointer(document.elementFromPoint(point.x, point.y));
  };

  const paint = (layout: EvolutionLayout) => {
    const refs = elements.current;
    if (!refs) return;
    current.current = layout;
    layout.columns.forEach((column, index) => {
      refs.columns[index].setAttribute("x", String(column.x));
      refs.columns[index].setAttribute("width", String(column.width));
      refs.labels[index].setAttribute("x", String(column.x + column.width / 2));
    });
    layout.xs.forEach((x, index) => {
      refs.nodes[index].setAttribute("transform", `translate(${x},0)`);
      refs.circles[index].forEach((circle, circleIndex) => circle.setAttribute("r", String(layout.radii[index] + [5, 4, 0][circleIndex])));
    });
    refs.lines.forEach((line, index) => {
      line.setAttribute("x1", String(layout.xs[index]));
      line.setAttribute("x2", String(layout.xs[index + 1]));
    });
    positionCallback.current(year.nodes, layout.xs);
  };

  useLayoutEffect(() => {
    const group = root.current!;
    elements.current = {
      columns: Array.from(group.querySelectorAll<SVGRectElement>("[data-column]")),
      labels: Array.from(group.querySelectorAll<SVGTextElement>("[data-column-label]")),
      nodes: Array.from(group.querySelectorAll<SVGGElement>("[data-node]")),
      circles: Array.from(group.querySelectorAll<SVGGElement>("[data-node]")).map((node) => Array.from(node.querySelectorAll("circle"))),
      lines: Array.from(group.querySelectorAll<SVGLineElement>("[data-connection]")),
    };
    current.current = base;
    frame.current = 0;
    targetCategory.current = null;
    pointerCategory.current = null;
    focusCategory.current = null;
    pointer.current = null;
    hoveredSlug.current = null;
    group.dataset.expandedCategory = "";
    group.dataset.animating = "false";
    return () => { cancelAnimationFrame(frame.current); frame.current = 0; };
  }, [base]);

  const expand = (category: string | null) => {
    if (targetCategory.current === category) return;
    targetCategory.current = category;
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    hoveredSlug.current = null;
    if (!focusCategory.current) onDeactivate("pointer");
    const from = current.current;
    const to = evolutionLayout(year, category);
    const group = root.current!;
    group.dataset.expandedCategory = category ?? "";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(to);
      group.dataset.animating = "false";
      restorePointer();
      return;
    }
    const start = performance.now();
    group.dataset.animating = "true";
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 430);
      const eased = 1 - Math.pow(1 - progress, 3);
      const mix = (a: number, b: number) => a + (b - a) * eased;
      paint({
        columns: to.columns.map((column, index) => ({ ...column, x: mix(from.columns[index].x, column.x), width: mix(from.columns[index].width, column.width) })),
        xs: to.xs.map((x, index) => mix(from.xs[index], x)),
        radii: to.radii.map((radius, index) => mix(from.radii[index], radius)),
      });
      if (progress < 1) frame.current = requestAnimationFrame(tick);
      else { frame.current = 0; group.dataset.animating = "false"; restorePointer(); }
    };
    frame.current = requestAnimationFrame(tick);
  };

  return <g ref={root} data-reading-year={year.year} data-animating="false"
    onPointerMove={(event) => {
      pointer.current = { x: event.clientX, y: event.clientY };
      const category = (event.target as Element).closest("[data-reading-category]")?.getAttribute("data-reading-category");
      if (category) { pointerCategory.current = category; if (!focusCategory.current) expand(category); }
      activatePointer(event.target as Element);
    }}
    onPointerLeave={() => { pointer.current = null; pointerCategory.current = null; hoveredSlug.current = null; if (!focusCategory.current) expand(null); }}
    onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) { focusCategory.current = null; expand(pointerCategory.current); }
    }}
    onKeyDown={(event) => { if (event.key === "Escape") expand(null); }}>
    <g aria-hidden="true">
      <rect x="0" y={year.top} width={EVOLUTION_WIDTH} height={year.bottom - year.top} fill="transparent" />
      {base.columns.map((column) => <g key={column.category}>
        <rect data-column data-reading-category={column.category} x={column.x} y={year.top + 16} width={column.width} height={year.bottom - year.top - 32}
          rx="12" fill="currentColor" fillOpacity="0.035" stroke="currentColor" strokeOpacity="0.08" />
        <text data-column-label x={column.x + column.width / 2} y={(year.top + year.bottom) / 2}
          textAnchor="middle" fill="currentColor" opacity="0.16" pointerEvents="none"
          className="font-serif text-[28px]" style={{ writingMode: "vertical-rl", textOrientation: "upright" }}>{column.category}</text>
      </g>)}
      <line x1="0" y1={year.top} x2={EVOLUTION_WIDTH} y2={year.top} stroke="currentColor" strokeOpacity="0.1" />
      <text x="14" y={(year.top + year.bottom) / 2} fill="currentColor" className="font-serif text-[30px]">{year.year}</text>
      <text x="15" y={(year.top + year.bottom) / 2 + 23} fill="currentColor" opacity="0.45" className="font-sans text-[9px]">12月 — 1月 · {year.nodes.length} 本</text>
      {year.nodes.slice(1).map((node, index) => <line key={node.book.slug} data-connection
        x1={base.xs[index]} y1={year.nodes[index].y} x2={base.xs[index + 1]} y2={node.y}
        stroke="currentColor" strokeOpacity="0.19" strokeWidth="1" pointerEvents="none" />)}
    </g>
    {year.nodes.map((node, index) => {
      const selected = activeSlug === node.book.slug;
      const activate = (target: Element) => onActivate({ ...node, x: current.current.xs[index] }, target, "focus");
      return <g key={node.book.slug} data-node transform={`translate(${base.xs[index]},0)`}>
        <Link href={`/reading/${node.book.slug}?view=evolution`} prefetch={false} scroll={false} onClick={onBookClick}
          data-reading-category={node.category}
          data-book-index={index}
          aria-label={`${node.book.title}；${node.book.author ?? "作者未记录"}；分类 ${node.category}；${node.book.finishedDate}；阅读 ${node.book.readingTime ?? "时长未记录"}；${node.book.noteCount === undefined ? "笔记数量未记录" : `${node.book.noteCount} 条笔记`}`}
          aria-describedby={selected ? tooltipId : undefined} className="group/reading-node cursor-pointer outline-none"
          onPointerEnter={(event) => {
            pointer.current = { x: event.clientX, y: event.clientY };
            // Moving circles must not retarget the accordion under a stationary pointer.
            if (frame.current) return;
            pointerCategory.current = node.category;
            if (!focusCategory.current) expand(node.category);
            activatePointer(event.currentTarget);
          }}
          onPointerLeave={(event) => { hoveredSlug.current = null; if (document.activeElement !== event.currentTarget) onDeactivate("pointer"); }}
          onFocus={(event) => { focusCategory.current = node.category; expand(node.category); activate(event.currentTarget); }}
          onBlur={() => onDeactivate("focus")} onKeyDown={(event) => { if (event.key === "Escape") onDeactivate("focus"); }}>
          <circle cx="0" cy={node.y} r={node.radius + 5} fill="transparent" />
          <circle cx="0" cy={node.y} r={node.radius + 4} fill="none" stroke="currentColor" strokeOpacity={selected ? 0.7 : 0} pointerEvents="none"
            className="group-focus-visible/reading-node:[stroke-opacity:0.7]" />
          <circle cx="0" cy={node.y} r={node.radius} fill="currentColor" fillOpacity={selected ? 0.95 : 0.56} stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.25" pointerEvents="none" />
        </Link>
      </g>;
    })}
  </g>;
}
