"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import { buildSrc } from "@/lib/oss";
import type { Photo } from "@/lib/works";

/**
 * 详情页大图浏览组件。
 *
 * 网格部分：Justified Layout（react-photo-album rows 模式）。
 *   每张图按真实宽高比例排版，行高一致——横竖混排不裁切、不留白。
 *   尺寸来自 lib/image-meta.ts 的 OSS 探测缓存（构建期注入到 Photo.width/height）。
 *
 * Lightbox 部分：移植自 ormissia-album 的 Lightbox 风格——
 *   - 顶部居中工具条（缩小 / 百分比 / 放大 / 适应 / 1:1）
 *   - 右上关闭、左右箭头切换
 *   - 滚轮缩放、按住拖拽平移、双指捏合 / 双指滑动
 *   - 键盘 esc / ← / → / +/- / 0 / 1
 *   - 底部居中快捷键提示
 */

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;

// 缺失尺寸时的兜底比例（横图 3:2）。理论上 image-meta 会补齐，
// 但探测失败 / demo 模式仍可能落到这里——给个安全默认避免布局炸。
const FALLBACK_W = 3;
const FALLBACK_H = 2;

export function PlatesGrid({
  photos,
  workTitle,
}: {
  photos: Photo[];
  workTitle: string;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const isOpen = activeIdx !== null;

  const close = useCallback(() => setActiveIdx(null), []);
  const prev = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );
  const next = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length]
  );

  // 滚动锁定 + 通知 header 隐藏
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.lightboxOpen = "true";
    return () => {
      document.body.style.overflow = prevOverflow;
      delete document.body.dataset.lightboxOpen;
    };
  }, [isOpen]);

  const albumPhotos = photos.map((p, i) => ({
    src: buildSrc(p.key, "detail"),
    width: p.width ?? FALLBACK_W,
    height: p.height ?? FALLBACK_H,
    key: p.key,
    alt: p.caption ?? `${workTitle} plate ${i + 1}`,
  }));

  return (
    <>
      <RowsPhotoAlbum
        photos={albumPhotos}
        targetRowHeight={420}
        spacing={24}
        onClick={({ index }) => setActiveIdx(index)}
      />

      {isOpen && (
        <Lightbox
          src={buildSrc(photos[activeIdx!].key, "hero")}
          alt={photos[activeIdx!].caption ?? `${workTitle} plate ${activeIdx! + 1}`}
          onClose={close}
          onPrev={photos.length > 1 ? prev : undefined}
          onNext={photos.length > 1 ? next : undefined}
        />
      )}
    </>
  );
}

interface LightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function Lightbox({ src, alt, onClose, onPrev, onNext }: LightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist: number } | null>(null);
  const touchTriggeredRef = useRef(false);
  // wheel handler 在 useCallback 里读 scale 会闭包旧值，用 ref 同步当前缩放
  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoom100 = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.5, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => {
      const newScale = Math.max(s - 0.5, MIN_SCALE);
      if (newScale <= 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && onPrev) {
        resetView();
        onPrev();
      } else if (e.key === "ArrowRight" && onNext) {
        resetView();
        onNext();
      } else if (e.key === "+" || e.key === "=") handleZoomIn();
      else if (e.key === "-") handleZoomOut();
      else if (e.key === "0") resetView();
      else if (e.key === "1") handleZoom100();
    },
    [onClose, onPrev, onNext, handleZoomIn, handleZoomOut, resetView, handleZoom100]
  );

  const clampPosition = useCallback((x: number, y: number, currentScale: number) => {
    const container = containerRef.current;
    if (!container) return { x, y };
    const maxX = (container.clientWidth * (currentScale - 1)) / 2;
    const maxY = (container.clientHeight * (currentScale - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  /**
   * 触摸板/滚轮兼容：
   * - macOS 触摸板捏合 → 浏览器触发带 ctrlKey=true 的 wheel；deltaY 很小（±10），用指数函数细腻缩放
   * - 鼠标滚轮 → deltaY ≈ ±100，按 0.2 步长跳档
   * - 触摸板双指滑动（不带 ctrlKey）→ 在已放大状态下平移；scale=1 时忽略，避免误触发
   */
  const handleWheel = useCallback((e: WheelEvent) => {
    const isPinch = e.ctrlKey;
    if (isPinch) {
      e.preventDefault();
      // 以鼠标位置为锚点：缩放后该点在屏幕上保持不动
      const container = containerRef.current;
      const rect = container?.getBoundingClientRect();
      const cx = rect ? e.clientX - rect.left - rect.width / 2 : 0;
      const cy = rect ? e.clientY - rect.top - rect.height / 2 : 0;
      setScale((prev) => {
        const factor = Math.exp(-e.deltaY * 0.02);
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * factor));
        if (next === prev) return prev;
        if (next <= 1) {
          setPosition({ x: 0, y: 0 });
        } else {
          // 锚点公式：保持 (cx, cy) 屏幕坐标在缩放前后映射到同一图像点
          setPosition((p) => {
            const ratio = next / prev;
            return {
              x: cx - (cx - p.x) * ratio,
              y: cy - (cy - p.y) * ratio,
            };
          });
        }
        return next;
      });
      return;
    }

    // 鼠标滚轮 / 触摸板双指上下滑：用 deltaMode 区分
    // - WheelEvent.DOM_DELTA_PIXEL (0)：触摸板（细腻），deltaY ≈ ±2 ~ ±20
    // - WheelEvent.DOM_DELTA_LINE (1) / PAGE：鼠标滚轮，deltaY 单位为行/页
    const isMouseWheel = e.deltaMode !== 0 || Math.abs(e.deltaY) >= 50;

    if (isMouseWheel) {
      // 鼠标滚轮：保持原行为，按固定步长缩放
      e.preventDefault();
      if (e.deltaY < 0) {
        setScale((s) => Math.min(s + 0.2, MAX_SCALE));
      } else {
        setScale((s) => {
          const newScale = Math.max(s - 0.2, MIN_SCALE);
          if (newScale <= 1) setPosition({ x: 0, y: 0 });
          return newScale;
        });
      }
    } else {
      // 触摸板双指滑动：放大后平移；未放大时不响应（避免误关 / 误缩放）
      if (scaleRef.current <= 1) return;
      e.preventDefault();
      setPosition((p) =>
        clampPosition(p.x - e.deltaX, p.y - e.deltaY, scaleRef.current)
      );
    }
  }, [clampPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const rawX = e.clientX - dragStart.x;
      const rawY = e.clientY - dragStart.y;
      setPosition(clampPosition(rawX, rawY, scale));
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const getTouchDist = (touches: React.TouchList) =>
    Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchTriggeredRef.current = false;
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    } else if (e.touches.length === 2) {
      touchStartRef.current = { x: 0, y: 0, dist: getTouchDist(e.touches) };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const newDist = getTouchDist(e.touches);
      const ratio = newDist / touchStartRef.current.dist;
      setScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * ratio)));
      touchStartRef.current = { ...touchStartRef.current, dist: newDist };
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || touchTriggeredRef.current) return;
      if (e.changedTouches.length === 1 && touchStartRef.current.dist === 0) {
        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
        if (Math.abs(deltaX) > 50 && deltaY < 80) {
          touchTriggeredRef.current = true;
          if (deltaX < 0 && onNext) {
            resetView();
            onNext();
          } else if (deltaX > 0 && onPrev) {
            resetView();
            onPrev();
          }
        }
      }
      touchStartRef.current = null;
    },
    [onNext, onPrev, resetView]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    const container = containerRef.current;
    if (container) container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (container) container.removeEventListener("wheel", handleWheel);
    };
  }, [handleKeyDown, handleWheel]);

  // 切换图片时重置缩放
  useEffect(() => {
    resetView();
  }, [src, resetView]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && scale === 1) {
      onClose();
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={handleBackgroundClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 顶部工具栏 */}
      <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/50 px-4 py-2">
        <button
          className="p-1 text-white/70 hover:text-white"
          onClick={handleZoomOut}
          title="缩小 (-)"
          aria-label="缩小"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M8 11h6" />
          </svg>
        </button>
        <span className="min-w-[60px] text-center text-sm text-white/70">
          {Math.round(scale * 100)}%
        </span>
        <button
          className="p-1 text-white/70 hover:text-white"
          onClick={handleZoomIn}
          title="放大 (+)"
          aria-label="放大"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </button>
        <div className="mx-1 h-6 w-px bg-white/30" />
        <button
          className="p-1 text-white/70 hover:text-white"
          onClick={resetView}
          title="适应屏幕 (0)"
          aria-label="适应屏幕"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
        <button
          className="p-1 text-white/70 hover:text-white"
          onClick={handleZoom100}
          title="100% (1)"
          aria-label="100%"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <text x="12" y="15" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">
              1:1
            </text>
          </svg>
        </button>
      </div>

      {/* 关闭 */}
      <button
        className="absolute right-4 top-4 z-20 text-white/70 hover:text-white"
        onClick={onClose}
        aria-label="关闭"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* 上一张 */}
      {onPrev && (
        <button
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 p-2 text-white/70 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            resetView();
            onPrev();
          }}
          aria-label="上一张"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* 下一张 */}
      {onNext && (
        <button
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 p-2 text-white/70 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            resetView();
            onNext();
          }}
          aria-label="下一张"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* 图片 */}
      <div
        className="relative select-none"
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="block h-auto max-h-[90vh] w-auto max-w-[90vw] object-contain"
        />
      </div>

      {/* 底部快捷键提示 */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 select-none text-xs tracking-widest text-white/30 md:block">
        ESC 关闭 &nbsp;·&nbsp; ← → 切换 &nbsp;·&nbsp; 滚轮缩放
      </div>
    </div>
  );
}
