"use client";

import { useEffect, useRef, useState } from "react";

const TEXT = "SILENCE — PHOTOGRAPHS & NOTES — LANDSCAPE — PORTRAIT — SNAPSHOTS — FILM — READING — JOURNAL — ";
const SCROLL_RATIO = 0.3;

/** Scroll position sets horizontal position; idle pages have no animation loop. */
export function ScrollMarquee() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(3);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const firstCopy = track?.firstElementChild;
    if (!viewport || !track || !firstCopy) return;

    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let period = 0;
    const update = () => {
      frame = 0;
      if (!period || document.hidden || media?.matches) return;
      const offset = -(Math.max(0, window.scrollY) * SCROLL_RATIO % period);
      track.style.transform = `translateX(${offset}px)`;
    };
    const schedule = () => {
      if (!frame && period && !document.hidden && !media?.matches) frame = requestAnimationFrame(update);
    };
    const syncMotion = () => {
      if (document.hidden || media?.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        if (media?.matches) track.style.transform = "translateX(0px)";
      } else schedule();
    };
    const measure = () => {
      period = firstCopy.getBoundingClientRect().width;
      if (!period) return;
      // One extra copy covers the strip even just before a complete wrap.
      setCopies(Math.max(2, Math.ceil(viewport.clientWidth / period) + 1));
      syncMotion();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(firstCopy);
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("visibilitychange", syncMotion);
    media?.addEventListener("change", syncMotion);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("visibilitychange", syncMotion);
      media?.removeEventListener("change", syncMotion);
    };
  }, []);

  return (
    <div ref={viewportRef} className="site-header-marquee hidden overflow-hidden border-t border-ink/10 py-1.5 text-[9px] uppercase tracking-[0.22em] sm:block" aria-hidden="true">
      <div ref={trackRef} className="silence-marquee pl-3">
        {Array.from({ length: copies }, (_, index) => <span key={index} className="shrink-0 whitespace-nowrap pr-12">{TEXT}</span>)}
      </div>
    </div>
  );
}
