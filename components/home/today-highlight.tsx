"use client";

import { motion, useReducedMotion, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { RevealImage as Image } from "@/components/media/reveal-image";
import { buildSrc } from "@/lib/oss";
import type { HighlightBook } from "@/lib/reading/types";
import styles from "./today-highlight.module.css";

const CLOSE_DELAY = 240;
const COMPACT_WIDTH = 860;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
type Geometry = { width: number; height: number; centers: { x: number; y: number }[] };

export function TodayHighlight({ books }: { books: HighlightBook[] }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const covers = useRef<(HTMLButtonElement | null)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollFrame = useRef<number | null>(null);
  const method = useRef("keyboard");
  const suppressFocus = useRef(false);
  const [active, setActive] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [touchLayout, setTouchLayout] = useState(false);
  const [geometry, setGeometry] = useState<Geometry>({ width: 0, height: 0, centers: [] });
  const reduced = useReducedMotion();
  const compact = touchLayout || geometry.width < COMPACT_WIDTH;

  const clearTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const close = useCallback(() => {
    clearTimer();
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = null;
    const focusedNote = root.current?.querySelector<HTMLButtonElement>("[data-highlight-note]:focus");
    if (focusedNote) {
      suppressFocus.current = true;
      covers.current[Number(focusedNote.dataset.highlightNote)]?.focus({ preventScroll: true });
      suppressFocus.current = false;
    }
    setActive(null);
    setExpanded(null);
  }, [clearTimer]);
  const open = (book: number, note: number | null = null) => {
    clearTimer();
    const focusedNote = root.current?.querySelector<HTMLButtonElement>("[data-highlight-note]:focus");
    if (focusedNote && Number(focusedNote.dataset.highlightNote) !== book) {
      suppressFocus.current = true;
      covers.current[book]?.focus({ preventScroll: true });
      suppressFocus.current = false;
    }
    setActive(book);
    setExpanded(note);
  };
  const leave = (event: ReactPointerEvent<HTMLElement>) => {
    if (compact || event.pointerType !== "mouse") return;
    clearTimer();
    // The cover and scattered cards do not share a continuous hit area.
    timer.current = setTimeout(close, CLOSE_DELAY);
  };

  useEffect(() => {
    return () => { if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current); };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const sync = () => setTouchLayout(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      setGeometry({ width: bounds.width, height: bounds.height, centers: covers.current.map(cover => {
        const rect = cover?.getBoundingClientRect();
        return rect ? { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 } : { x: 0, y: 0 };
      }) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    covers.current.forEach(cover => { if (cover) observer.observe(cover); });
    return () => observer.disconnect();
  }, [books]);

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      method.current = event.pointerType === "touch" ? "touch" : "pointer";
      const target = event.target as Element;
      if (!root.current?.contains(target) || !target.closest("button, a")) close();
    };
    const keyboard = (event: KeyboardEvent) => {
      method.current = "keyboard";
      if (event.key !== "Escape" || active === null) return;
      if (root.current?.contains(document.activeElement)) {
        suppressFocus.current = true;
        covers.current[active]?.focus({ preventScroll: true });
        suppressFocus.current = false;
      }
      close();
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", keyboard, true);
      clearTimer();
    };
  }, [active, close, clearTimer]);

  return (
    <div ref={root} data-home-snap-point="highlight" data-compact={compact} className={styles.section}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
      <header className={styles.header}>
        <div>
          <p className="font-sans text-caption uppercase text-muted">Today&apos;s Highlights</p>
          <h2 className="mt-3 font-sans text-headline font-normal">书页里的回声</h2>
        </div>
      </header>
      {books.length === 0 ? <p className="py-16 font-sans text-body text-muted">还没有可以展示的划线笔记。</p> : (
        <div ref={stage} className={styles.stage} data-compact={compact} data-open={active !== null}>
          <div className={styles.shelf} style={{ "--book-count": books.length, "--mobile-book-count": Math.min(2, books.length) } as CSSProperties}>
            {books.map((book, bookIndex) => {
              const selected = active === bookIndex;
              const center = geometry.centers[bookIndex] ?? { x: 0, y: 0 };
              return <article key={book.slug} className={styles.book} data-selected={selected}>
                <div className={styles.bookMain}>
                  <HighlightCover buttonRef={element => { covers.current[bookIndex] = element; }}
                    book={book} selected={selected} compact={compact} reduced={Boolean(reduced)}
                    onPointerEnter={event => { if (event.pointerType === "mouse" && !compact) { method.current = "pointer"; open(bookIndex); } }}
                    onPointerLeave={leave} onPointerCancel={leave}
                    onFocus={() => { if (!suppressFocus.current && method.current === "keyboard") open(bookIndex); }}
                    onClick={() => {
                      open(bookIndex);
                      if (compact) {
                        if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
                        scrollFrame.current = requestAnimationFrame(() => {
                          scrollFrame.current = null;
                          const region = document.getElementById(`highlights-${book.slug}`);
                          if (root.current?.contains(region)) region?.scrollIntoView({ block: "nearest", behavior: reduced ? "instant" : "smooth" });
                        });
                      }
                    }} />
                </div>
                <div id={`highlights-${book.slug}`} role="region" aria-label={`《${book.title}》的划线笔记`}
                  hidden={compact && !selected} aria-hidden={!selected} className={styles.notes}>
                  {book.highlights.map((text, index) => {
                    const enlarged = expanded === index;
                    const angle = -Math.PI / 2 + index * Math.PI * 2 / book.highlights.length;
                    const width = enlarged ? 320 : 184;
                    const radiusX = Math.min(228, geometry.width * .19);
                    const radiusY = Math.min(220, geometry.height * .36);
                    const x = clamp(center.x + Math.cos(angle) * radiusX, width / 2 + 12, geometry.width - width / 2 - 12);
                    const baseY = clamp(center.y + Math.sin(angle) * radiusY, 86, geometry.height - 86);
                    // Keep the preview's outer edge fixed so growing a short note cannot lose the pointer.
                    const verticalAnchor = Math.sin(angle) < -.25 ? "top" : Math.sin(angle) > .25 ? "bottom" : "center";
                    const y = verticalAnchor !== "center" ? baseY + (verticalAnchor === "top" ? -74 : 74) : baseY;
                    return <motion.button key={index} type="button" className={styles.note}
                      data-highlight-note={bookIndex} data-expanded={enlarged} data-anchor={verticalAnchor}
                      aria-expanded={enlarged} aria-label={`划线 ${index + 1}：${text}`}
                      tabIndex={selected ? 0 : -1} initial={false}
                      animate={{ width: compact ? "100%" : width, height: compact || enlarged ? "auto" : 148, ...(!selected ? { opacity: 0, x: center.x, y: center.y, scale: .25, rotate: 0 } : compact ? { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 } : {
                        opacity: 1, x, y, scale: enlarged ? 1.04 : 1, rotate: enlarged ? 0 : (index % 2 === 0 ? -1 : 1) * (4 + index % 3 * 2),
                      }) }}
                      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 270, damping: 25, mass: .75 }}
                      style={{ zIndex: enlarged ? 30 : 10 + index, pointerEvents: selected ? "auto" : "none" }}
                      onPointerEnter={event => { if (event.pointerType === "mouse" && !compact) { method.current = "pointer"; open(bookIndex, index); } }}
                      onPointerLeave={leave} onPointerCancel={leave}
                      onFocus={() => { if (method.current === "keyboard") open(bookIndex, index); }}
                      onClick={() => open(bookIndex, index)}
                      onKeyDown={event => {
                        if (!enlarged || !["ArrowDown", "ArrowUp"].includes(event.key)) return;
                        event.preventDefault();
                        event.currentTarget.querySelector("[data-note-text]")?.scrollBy({ top: event.key === "ArrowDown" ? 60 : -60 });
                      }}>
                      <span className="mb-3 block font-sans text-annotation tracking-normal text-muted">{String(index + 1).padStart(2, "0")} / 划线</span>
                      <span className={styles.noteCopy} aria-hidden="true">
                        <span className={`${styles.notePreview} font-sans text-body`}>{text}</span>
                        <span data-note-text className={`${styles.noteText} font-sans text-body`}>{text}</span>
                      </span>
                    </motion.button>;
                  })}
                </div>
              </article>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type CoverProps = {
  book: HighlightBook;
  selected: boolean;
  compact: boolean;
  reduced: boolean;
  buttonRef: (element: HTMLButtonElement | null) => void;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "onPointerEnter" | "onPointerLeave" | "onPointerCancel" | "onFocus" | "onClick">;

function HighlightCover({ book, selected, compact, reduced, buttonRef, onPointerEnter, onPointerLeave, onPointerCancel, ...events }: CoverProps) {
  const spring = { stiffness: 220, damping: 22, mass: .65 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);
  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);
  const animated = !compact && !reduced;

  const reset = () => {
    x.set(0); y.set(selected && animated ? -6 : 0);
    rotateX.set(0); rotateY.set(0);
  };
  useEffect(() => {
    x.set(0); y.set(selected && animated ? -6 : 0);
    rotateX.set(0); rotateY.set(0);
  }, [selected, animated, x, y, rotateX, rotateY]);

  const followPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!animated || event.pointerType !== "mouse") return;
    // Measure the stationary button, not the moving artwork, to avoid feedback jitter.
    const rect = event.currentTarget.getBoundingClientRect();
    const horizontal = clamp((event.clientX - rect.left) / rect.width - .5, -.5, .5);
    const vertical = clamp((event.clientY - rect.top) / rect.height - .5, -.5, .5);
    x.set(horizontal * 20); y.set(vertical * 16 - 6);
    rotateX.set(-vertical * 10); rotateY.set(horizontal * 12);
  };

  return <button {...events} ref={buttonRef} type="button" className={styles.cover}
    aria-label={`展开《${book.title}》的划线笔记`} aria-expanded={selected} aria-controls={`highlights-${book.slug}`}
    onPointerEnter={event => { onPointerEnter?.(event); followPointer(event); }} onPointerMove={followPointer}
    onPointerLeave={event => { reset(); onPointerLeave?.(event); }}
    onPointerCancel={event => { reset(); onPointerCancel?.(event); }}>
    <motion.span className={styles.coverArtwork} style={{ x, y, rotateX, rotateY, transformPerspective: 700 }}
      initial={false} animate={{ scale: selected && animated ? 1.07 : 1, rotate: selected && animated ? book.coverRotation * .25 : book.coverRotation }}
      transition={reduced ? { duration: 0 } : { type: "spring", ...spring }}>
      <BookCover book={book} />
    </motion.span>
  </button>;
}

function BookCover({ book }: { book: HighlightBook }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="flex h-full items-center justify-center p-4 font-sans text-body">{book.title}</span> : (
    <Image src={buildSrc(book.cover, "portrait")} alt={book.title} fill
      sizes="(min-width: 1400px) 146px, (min-width: 1280px) calc((100vw - 236px) / 8), (min-width: 1024px) calc((100vw - 216px) / 7), (min-width: 768px) calc((100vw - 176px) / 5), (min-width: 640px) calc((100vw - 88px) / 3), calc((100vw - 68px) / 2)"
      className="object-cover" onError={() => setFailed(true)} />
  );
}
