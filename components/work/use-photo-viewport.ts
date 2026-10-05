"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;

type PhotoViewportOptions = {
  src: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

/** 负责灯箱视口与输入事件；导航和关闭由相册提供，数值规则保持原样。 */
export function usePhotoViewport({ src, onClose, onPrev, onNext }: PhotoViewportOptions) {
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

  return {
    scale, position, isDragging, containerRef, resetView,
    handleZoom100, handleZoomIn, handleZoomOut, handleMouseDown,
    handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd,
  };
}
