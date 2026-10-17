"use client";

import { useEffect } from "react";

export const SCROLL_SNAP_FEEL = {
  distance: 88,
  idleMs: 160,
  durationMs: 180,
  mergeDistance: 32,
} as const;

export type ScrollSnapPoint = number | {
  selector: string;
  /** start 对齐导航栏下沿，end 对齐视口底部。 */
  align?: "start" | "end";
  gap?: number;
  /** 近邻停点重合时保留优先级较高的一项。 */
  priority?: number;
};

type ScrollSnapOptions = {
  points: readonly ScrollSnapPoint[];
  minHeight?: number;
  disabledSelector?: string;
};

export function useScrollSnap({ points, minHeight = 720, disabledSelector }: ScrollSnapOptions) {
  useEffect(() => {
    const media = window.matchMedia(`(min-width: 1024px) and (min-height: ${minHeight}px) and (prefers-reduced-motion: no-preference)`);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame: number | undefined;
    let intent = false;
    let direction = 0;
    let lastY = window.scrollY;

    const clearPending = () => {
      if (timer !== undefined) clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
      timer = undefined;
      frame = undefined;
    };
    const cancel = () => {
      clearPending();
      intent = false;
      direction = 0;
      lastY = window.scrollY;
    };
    const eligible = () => media.matches && !document.querySelector("dialog[open]") &&
      !(disabledSelector && document.querySelector(disabledSelector)) &&
      !["hidden", "clip"].includes(getComputedStyle(document.body).overflowY);

    const settle = () => {
      timer = undefined;
      const travelDirection = direction;
      intent = false;
      direction = 0;
      if (!travelDirection || !eligible()) return;

      const startY = window.scrollY;
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")) || 0;
      const targets = points.flatMap((point) => {
        if (typeof point === "number") return [{ y: point, priority: 0 }];
        return Array.from(document.querySelectorAll(point.selector), (element) => {
          const rect = element.getBoundingClientRect();
          const gap = point.gap ?? 0;
          const y = point.align === "end"
            ? rect.bottom + startY - window.innerHeight + gap
            : rect.top + startY - headerHeight - gap;
          return { y, priority: point.priority ?? 0 };
        });
      }).map((point) => ({ ...point, y: Math.max(0, Math.min(maxY, point.y)) }));
      const target = targets
        .filter((point) => !targets.some((other) => other.priority > point.priority &&
          Math.abs(other.y - point.y) <= SCROLL_SNAP_FEEL.mergeDistance))
        .map((point) => point.y)
        .filter((y) => (y - startY) * travelDirection > 0.5 && (y - startY) * travelDirection <= SCROLL_SNAP_FEEL.distance)
        .sort((a, b) => Math.abs(a - startY) - Math.abs(b - startY))[0];
      if (target === undefined) return;

      let started: number | undefined;
      const align = (now: number) => {
        started ??= now;
        const progress = Math.min(1, (now - started) / SCROLL_SNAP_FEEL.durationMs);
        window.scrollTo({ top: startY + (target - startY) * (1 - (1 - progress) ** 3), behavior: "instant" });
        lastY = window.scrollY;
        frame = progress < 1 ? requestAnimationFrame(align) : undefined;
      };
      frame = requestAnimationFrame(align);
    };
    const schedule = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(settle, SCROLL_SNAP_FEEL.idleMs);
    };
    const begin = () => {
      if (!eligible()) {
        cancel();
        return;
      }
      clearPending();
      if (!intent) direction = 0;
      intent = true;
      schedule();
    };
    const onScroll = () => {
      const delta = window.scrollY - lastY;
      lastY = window.scrollY;
      if (!intent) return;
      if (Math.abs(delta) >= 0.5) direction = Math.sign(delta);
      schedule();
    };
    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        cancel();
        return;
      }
      begin();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey ||
          !(event.target instanceof Element) || event.target.closest("input, textarea, select, [contenteditable], [role='dialog']")) {
        cancel();
        return;
      }
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(event.key) ||
          (event.key === " " && !event.target.closest("button, a, [role='button']"))) begin();
      else cancel();
    };

    media.addEventListener("change", cancel);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", cancel);
    window.addEventListener("popstate", cancel);
    window.addEventListener("pagehide", cancel);
    window.addEventListener("blur", cancel);
    document.addEventListener("pointerdown", cancel, true);
    document.addEventListener("click", cancel, true);
    document.addEventListener("focusin", cancel);
    return () => {
      cancel();
      media.removeEventListener("change", cancel);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", cancel);
      window.removeEventListener("popstate", cancel);
      window.removeEventListener("pagehide", cancel);
      window.removeEventListener("blur", cancel);
      document.removeEventListener("pointerdown", cancel, true);
      document.removeEventListener("click", cancel, true);
      document.removeEventListener("focusin", cancel);
    };
  }, [points, minHeight, disabledSelector]);
}
