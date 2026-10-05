"use client";

import { RevealImg } from "@/components/media/reveal-image";
import { usePhotoViewport } from "./use-photo-viewport";

interface PhotoLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function PhotoLightbox({ src, alt, onClose, onPrev, onNext }: PhotoLightboxProps) {
  const {
    scale, position, isDragging, containerRef, resetView,
    handleZoom100, handleZoomIn, handleZoomOut, handleMouseDown,
    handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd,
  } = usePhotoViewport({ src, onClose, onPrev, onNext });

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && scale === 1) {
      onClose();
    }
  };

  return (
    <div
      ref={containerRef}
      className="lightbox-enter fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
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
        <RevealImg
          key={src}
          src={src}
          alt={alt}
          draggable={false}
          className="lightbox-image block h-auto max-h-[90vh] w-auto max-w-[90vw] object-contain"
        />
      </div>

      {/* 底部快捷键提示 */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 select-none text-label tracking-widest text-white/30 md:block">
        ESC 关闭 &nbsp;·&nbsp; ← → 切换 &nbsp;·&nbsp; 滚轮缩放
      </div>
    </div>
  );
}
