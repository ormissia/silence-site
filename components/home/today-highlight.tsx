"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { Highlight } from "@/lib/reading";

export function TodayHighlight({
  highlights,
  startIndex,
}: {
  /** 全量 highlights，本地切换上一/下一不需要请求 */
  highlights: Highlight[];
  /** 默认起始索引（来自 getDailyIndex，今天稳定） */
  startIndex: number;
}) {
  const total = highlights.length;
  const [idx, setIdx] = useState(startIndex);
  // 1 = 下一句（从右滑入），-1 = 上一句（从左滑入），0 = 初始
  const [direction, setDirection] = useState(0);

  const prev = useCallback(() => {
    setDirection(-1);
    setIdx((i) => (i - 1 + total) % total);
  }, [total]);
  const next = useCallback(() => {
    setDirection(1);
    setIdx((i) => (i + 1) % total);
  }, [total]);

  // 键盘 ←/→ 切换（只在视口内时）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  if (total === 0) return null;
  const current = highlights[idx];

  return (
    <div className="mx-auto max-w-[900px] px-6 text-center md:px-10">
      <p className="eyebrow">Today&apos;s Highlight</p>

      <div className="relative mt-8 min-h-[200px]">
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
            <blockquote className="font-serif text-headline leading-[1.55] text-ink/90">
              <span className="mr-2 align-top text-3xl text-accent">“</span>
              {current.text}
              <span className="ml-1 align-top text-3xl text-accent">”</span>
            </blockquote>
            <figcaption className="mt-8 font-sans text-label uppercase tracking-[0.24em] text-muted">
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
      <div className="mt-10 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={prev}
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 text-ink/70 transition hover:scale-110 hover:border-accent hover:text-accent"
          aria-label="上一句"
        >
          <span className="text-xl leading-none">‹</span>
        </button>
        <span className="font-sans text-label uppercase tracking-[0.24em] text-muted tabular-nums">
          {String(idx + 1).padStart(3, "0")} / {String(total).padStart(3, "0")}
        </span>
        <button
          type="button"
          onClick={next}
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 text-ink/70 transition hover:scale-110 hover:border-accent hover:text-accent"
          aria-label="下一句"
        >
          <span className="text-xl leading-none">›</span>
        </button>
      </div>
    </div>
  );
}
