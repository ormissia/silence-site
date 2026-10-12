"use client";

import { useCallback, useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import styles from "./selected-works.module.css";

const DESKTOP_HOVER = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

/** Keep the last card expanded while the pointer crosses the visual gaps. */
export function SelectedWorksGallery({ children }: { children: ReactNode }) {
  const activeRef = useRef<HTMLElement | null>(null);
  const pointRef = useRef<{ x: number; y: number } | null>(null);
  const enabledRef = useRef(false);

  const select = useCallback((card: HTMLElement | null) => {
    if (activeRef.current === card) return;
    activeRef.current?.removeAttribute("data-pointer-active");
    if (card) card.dataset.pointerActive = "true";
    activeRef.current = card;
  }, []);
  const clear = useCallback(() => {
    select(null);
    pointRef.current = null;
  }, [select]);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_HOVER);
    const sync = () => {
      enabledRef.current = media.matches;
      if (!media.matches) clear();
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      clear();
    };
  }, [clear]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabledRef.current || event.pointerType !== "mouse") return;
    const point = { x: event.clientX, y: event.clientY };
    if (pointRef.current?.x === point.x && pointRef.current.y === point.y) return;
    pointRef.current = point;
    const card = (event.target as Element).closest<HTMLElement>("[data-work-card]");
    // Layout animation can move card boundaries; only real movement selects a card.
    if (card && event.currentTarget.contains(card)) select(card);
  };

  return (
    <div className={`${styles.gallery} mt-10 md:mt-12`}
      onPointerMove={onPointerMove} onPointerLeave={clear} onPointerCancel={clear}>
      {children}
    </div>
  );
}
