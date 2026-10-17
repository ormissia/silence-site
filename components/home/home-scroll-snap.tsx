"use client";

import { useEffect } from "react";

/** Keep restored positions and keyboard focus untouched until the next scroll gesture. */
export function HomeScrollSnap() {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)");
    const disable = () => root.removeAttribute("data-home-snap");
    const enable = () => {
      if (!media.matches) return;
      if (document.querySelector(".home-splash, dialog[open]")) return;
      if (["hidden", "clip"].includes(getComputedStyle(document.body).overflowY)) return;
      root.dataset.homeSnap = "active";
    };
    const onWheel = (event: WheelEvent) => {
      if (!event.defaultPrevented && !event.ctrlKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) enable();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      disable();
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (!(event.target instanceof Element) || event.target.closest("input, textarea, select, [contenteditable], [role='dialog']")) return;
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(event.key)) enable();
      if (event.key === " " && !event.target.closest("button, a, [role='button']")) enable();
    };

    disable();
    media.addEventListener("change", disable);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", disable);
    window.addEventListener("popstate", disable);
    window.addEventListener("pagehide", disable);
    document.addEventListener("pointerdown", disable, true);
    document.addEventListener("click", disable, true);
    document.addEventListener("focusin", disable);
    return () => {
      disable();
      media.removeEventListener("change", disable);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", disable);
      window.removeEventListener("popstate", disable);
      window.removeEventListener("pagehide", disable);
      document.removeEventListener("pointerdown", disable, true);
      document.removeEventListener("click", disable, true);
      document.removeEventListener("focusin", disable);
    };
  }, []);

  return null;
}
