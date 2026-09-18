"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HighlightBatch } from "@/lib/reading";

export function TodayHighlight({
  initialBatch,
  startIndex,
}: {
  initialBatch: HighlightBatch;
  startIndex: number;
}) {
  const total = initialBatch.total;
  const cache = useRef(new Map(initialBatch.items.map(({ index, highlight }) => [index, highlight])));
  const [idx, setIdx] = useState(startIndex);
  const indexRef = useRef(startIndex);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    requestRef.current?.abort();
    requestRef.current = null;
  }, []);

  const change = useCallback(async (direction: number) => {
    if (total === 0 || requestRef.current) return;
    const target = (indexRef.current + direction + total) % total;
    setError("");
    if (!cache.current.has(target)) {
      const controller = new AbortController();
      requestRef.current = controller;
      setLoading(true);
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`/api/highlights?index=${target}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load highlights");
        const batch: HighlightBatch = await response.json();
        if (!batch.items.some((item) => item.index === target)) throw new Error("Missing highlight");
        if (requestRef.current !== controller) return;
        batch.items.forEach(({ index, highlight }) => cache.current.set(index, highlight));
        // 长时间浏览时也不让客户端缓存无限增长。
        while (cache.current.size > 50) {
          const oldest = cache.current.keys().next().value;
          if (oldest === undefined) break;
          cache.current.delete(oldest);
        }
      } catch {
        if (requestRef.current === controller) setError("暂时无法加载，请再次点击重试。");
        return;
      } finally {
        window.clearTimeout(timeout);
        if (requestRef.current === controller) {
          requestRef.current = null;
          setLoading(false);
        }
      }
    }
    setDirection(direction);
    indexRef.current = target;
    setIdx(target);
  }, [total]);

  const prev = () => { void change(-1); };
  const next = () => { void change(1); };
  const current = cache.current.get(idx);
  if (!current || total === 0) return null;

  return (
    <div
      className="grid gap-8 lg:grid-cols-12 lg:gap-x-8"
      aria-busy={loading}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          void change(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <p className="font-sans text-caption uppercase text-muted lg:col-span-3 lg:pt-2">Today&apos;s Highlight</p>

      <div className="relative min-w-0 lg:col-span-9">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.figure
            key={idx}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d === 0 ? 0 : d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: -d * 40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <blockquote className="max-w-prose font-sans text-body leading-loose text-ink/90">
              <span className="mr-2 align-top text-label text-accent">“</span>
              {current.text}
              <span className="ml-1 align-top text-label text-accent">”</span>
            </blockquote>
            <figcaption className="mt-6 font-sans text-caption leading-relaxed tracking-normal text-muted">
              —{" "}
              <a
                href={`/reading/${current.bookSlug}`}
                className="hover:text-accent"
              >
                {current.bookTitle}
              </a>
              {current.author && <span className="ml-2">· {current.author}</span>}
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      {/* 控制条：←  序号  → */}
      <div className="flex items-center gap-4 lg:col-span-9 lg:col-start-4">
        <button
          type="button"
          disabled={loading}
          onClick={prev}
          className="disabled:cursor-wait disabled:opacity-40 group flex h-11 w-11 items-center justify-center rounded-lg border border-ink/20 text-ink/70 transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          aria-label="上一句"
        >
          <span className="text-label leading-none">‹</span>
        </button>
        <span className="font-sans text-annotation text-muted tabular-nums">
          {String(idx + 1).padStart(3, "0")} / {String(total).padStart(3, "0")}
        </span>
        <button
          type="button"
          disabled={loading}
          onClick={next}
          className="disabled:cursor-wait disabled:opacity-40 group flex h-11 w-11 items-center justify-center rounded-lg border border-ink/20 text-ink/70 transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          aria-label="下一句"
        >
          <span className="text-label leading-none">›</span>
        </button>
      </div>
      <p role="status" hidden={!loading && !error} className="text-caption tracking-normal text-muted lg:col-span-9 lg:col-start-4">
        {loading ? "正在加载…" : error}
      </p>
    </div>
  );
}
