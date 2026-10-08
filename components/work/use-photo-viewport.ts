"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { INITIAL_PHOTO_VIEWPORT, photoViewportReducer } from "@/lib/photo-viewport";

type PhotoViewportOptions = {
  src: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

/** 负责灯箱视口与输入事件；导航和关闭由相册提供，数值规则保持原样。 */
export function usePhotoViewport({ src, onClose, onPrev, onNext }: PhotoViewportOptions) {
  const [{ scale, position }, dispatch] = useReducer(photoViewportReducer, INITIAL_PHOTO_VIEWPORT);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist: number } | null>(null);
  const touchTriggeredRef = useRef(false);
  // ref 只判断原生事件是否取消默认行为；视口更新由 reducer 按队列顺序处理。
  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const getViewportSize = useCallback(() => {
    const container = containerRef.current;
    return container ? { width: container.clientWidth, height: container.clientHeight } : null;
  }, []);

  const resetView = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  const handleZoom100 = resetView;

  const handleZoomIn = useCallback(() => {
    dispatch({ type: "zoom", delta: 0.5, size: getViewportSize() });
  }, [getViewportSize]);

  const handleZoomOut = useCallback(() => {
    dispatch({ type: "zoom", delta: -0.5, size: getViewportSize() });
  }, [getViewportSize]);

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
      dispatch({
        type: "pinch",
        factor: Math.exp(-e.deltaY * 0.02),
        anchor: { x: cx, y: cy },
        size: getViewportSize(),
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
      dispatch({ type: "zoom", delta: e.deltaY < 0 ? 0.2 : -0.2, size: getViewportSize() });
    } else {
      // 触摸板双指滑动：放大后平移；未放大时不响应（避免误关 / 误缩放）
      if (scaleRef.current > 1) e.preventDefault();
      dispatch({ type: "pan", delta: { x: -e.deltaX, y: -e.deltaY }, size: getViewportSize() });
    }
  }, [getViewportSize]);

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
      dispatch({ type: "move", position: { x: rawX, y: rawY }, size: getViewportSize() });
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
      dispatch({ type: "pinch", factor: ratio, size: getViewportSize() });
      touchStartRef.current = { ...touchStartRef.current, dist: newDist };
    }
  }, [getViewportSize]);

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
