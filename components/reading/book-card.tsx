"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import type { ReadingEntry } from "@/lib/reading";

/**
 * 单本书的封面卡片。
 *
 * 交互层次（hover 时同步发生）：
 *   1. 整张卡片 scale 1 → 1.08，z 方向提升 24px，制造"被托起来"的感觉
 *   2. 阴影从浅 8/24 加深到 24/56，配合 accent 色微染
 *   3. 内部封面跟随鼠标做 3D tilt：以图片中心为锚点，X 轴 ±10°、Y 轴 ±14°
 *
 * 性能：mouse 位置 → useMotionValue → useSpring 平滑 → useTransform 派生
 * 全部在 GPU transform 通道，不触发布局。
 */
export function BookCard({ book }: { book: ReadingEntry }) {
  const ref = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 180, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 180, damping: 18, mass: 0.6 });

  const rotateY = useTransform(sx, (v) => v * 28);   // ±14°
  const rotateX = useTransform(sy, (v) => -v * 20);  // ±10°

  const transform = useMotionTemplate`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <Link
      href={`/reading/${book.slug}`}
      className="group block"
      style={{ perspective: "900px" }}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="relative w-full will-change-transform"
        style={{
          transformStyle: "preserve-3d",
          transform,
        }}
        whileHover={{ scale: 1.08, z: 24 }}
        transition={{ type: "spring", stiffness: 220, damping: 22, mass: 0.7 }}
      >
        <div className="relative w-full overflow-hidden bg-ink/5 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-shadow duration-300 ease-out group-hover:shadow-[0_24px_56px_rgba(200,149,107,0.35),0_8px_20px_rgba(0,0,0,0.6)]">
          {book.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover}
              alt={book.title}
              className="block h-auto w-full object-contain"
              loading="lazy"
              draggable={false}
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
      </motion.div>

      <div className="mt-3">
        <h3 className="font-sans text-sm leading-tight text-ink group-hover:text-accent">
          {book.title}
        </h3>
        {book.author && (
          <p className="mt-1 font-sans text-[11px] text-muted">{book.author}</p>
        )}
        {(book.finishedDate ?? book.lastReadDate) && (
          <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.18em] text-muted">
            {book.finishedDate ?? book.lastReadDate}
          </p>
        )}
      </div>
    </Link>
  );
}
