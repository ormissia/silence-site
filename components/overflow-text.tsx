"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./overflow-text.module.css";

/** Scroll only the overflowing part, with a reading pause at either end. */
export function OverflowText({ text }: { text: string }) {
  const viewport = useRef<HTMLSpanElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const outer = viewport.current;
    const inner = content.current;
    if (!outer || !inner) return;

    const measure = () => setDistance(Math.max(0, inner.offsetWidth - outer.clientWidth));
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    measure();
    return () => observer.disconnect();
  }, [text]);

  const travelSeconds = distance / 20;
  const duration = travelSeconds + 4;
  const style = {
    "--scroll-distance": `${-distance}px`,
    "--scroll-duration": `${duration}s`,
    // Two seconds at each end, then move at 20 pixels per second.
    "--scroll-easing": `linear(0, 0 ${200 / duration}%, 1 ${100 - 200 / duration}%, 1)`,
  } as CSSProperties;

  return (
    <span ref={viewport} className={styles.viewport} title={text} style={style}>
      <span ref={content} className={styles.content} data-overflow={distance > 1}>
        {text || "\u00a0"}
      </span>
    </span>
  );
}
