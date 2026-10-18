"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type PointerEvent } from "react";
import { EnterListLink } from "@/components/layout/list-return";
import { RevealImage as Image } from "@/components/media/reveal-image";
import { readingBookHref } from "@/lib/navigation/reading";
import { buildSrc } from "@/lib/oss";
import styles from "./book-rows.module.css";

export type CoverBook = { slug: string; title: string; author?: string; cover?: string };
type Selection = { id: string; row: number; source: "pointer" | "keyboard" };
const ROW_STARTS = [0.08, 0.32, 0.6];
const SPEED = 16;
const IDLE_MS = 3000;

function setPhase(animation: Animation, progress: number, duration: number, start: number) {
  animation.currentTime = ((progress - start + 1) % 1) * duration;
}

/** Keyboard access can bring the canonical link into view without scrolling the clip. */
function revealFocusedBook(link: HTMLAnchorElement, gallery: HTMLDivElement) {
  const row = link.closest<HTMLElement>("[data-book-row]");
  const track = row?.querySelector<HTMLElement>("[data-book-track]");
  const animation = track?.getAnimations?.()[0];
  const group = track?.firstElementChild as HTMLElement | null;
  const distance = group?.getBoundingClientRect().width ?? 0;
  if (row && animation && distance) {
    const inset = parseFloat(getComputedStyle(row).paddingLeft) || 0;
    const center = (row.clientWidth - inset * 2) / 2;
    const offset = Math.max(0, Math.min(distance - 0.01, link.offsetLeft + link.offsetWidth / 2 - center));
    const index = Number(row.dataset.bookRow);
    const progress = index === 1 ? Math.min(0.999999, 1 - offset / distance) : offset / distance;
    setPhase(animation, progress, distance / SPEED * 1000, ROW_STARTS[index]);
  }
  link.scrollIntoView({ block: "nearest", inline: "nearest" });
  gallery.scrollLeft = 0;
}

export function BookRows({ books, transitioning = false, retainedId }: {
  books: CoverBook[]; transitioning?: boolean; retainedId?: string;
}) {
  const covered = useMemo(() => books.filter(book => book.cover).slice(0, 30), [books]);
  const rows = useMemo(() => Array.from({ length: 3 }, (_, row) =>
    covered.length < 3 ? covered : covered.filter((_, index) => index % 3 === row)
  ), [covered]);
  const galleryRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Selection | null>(null);
  const pointRef = useRef<{ x: number; y: number } | null>(null);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardRef = useRef(true);
  const availableRef = useRef(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [available, setAvailable] = useState(false);
  const [reduced, setReduced] = useState(false);
  const hasBooks = covered.length > 0;

  const select = useCallback((next: Selection | null) => {
    selectionRef.current = next;
    setSelection(current => current?.id === next?.id && current?.source === next?.source ? current : next);
  }, []);
  const clearTimer = useCallback(() => {
    if (idleRef.current !== null) clearTimeout(idleRef.current);
    idleRef.current = null;
  }, []);
  const clearPointer = useCallback(() => {
    clearTimer();
    if (selectionRef.current?.source === "pointer") select(null);
    // Keep the last coordinates: moving books cannot reactivate a stationary pointer.
  }, [clearTimer, select]);
  useEffect(() => {
    if (transitioning) { clearTimer(); select(null); }
  }, [transitioning, clearTimer, select]);
  const onResize = useCallback(() => {
    clearPointer();
    const gallery = galleryRef.current;
    if (gallery && selectionRef.current?.source === "keyboard") {
      const link = gallery.querySelector<HTMLAnchorElement>('[data-selected="true"]');
      if (link) revealFocusedBook(link, gallery);
    }
  }, [clearPointer]);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    let inViewport = false;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const visible = inViewport && !document.hidden;
      availableRef.current = visible;
      setAvailable(visible);
      setReduced(media.matches);
      if (!visible || media.matches) clearPointer();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      sync();
    });
    observer.observe(gallery);
    const onKeyDown = () => { keyboardRef.current = true; };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    sync();
    return () => {
      observer.disconnect();
      clearTimer();
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", sync);
      media.removeEventListener("change", sync);
    };
  }, [hasBooks, clearPointer, clearTimer]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (transitioning) return;
    if (event.pointerType !== "mouse") return;
    const previous = pointRef.current;
    const point = { x: event.clientX, y: event.clientY };
    pointRef.current = point;
    if (previous?.x === point.x && previous.y === point.y) return;
    if (!availableRef.current || selectionRef.current?.source === "keyboard") return;
    const link = (event.target as Element).closest<HTMLAnchorElement>("[data-book-id]");
    if (!link) { clearPointer(); return; }
    clearTimer();
    select({ id: link.dataset.bookId!, row: Number(link.dataset.row), source: "pointer" });
    idleRef.current = setTimeout(() => { idleRef.current = null; select(null); }, IDLE_MS);
  };
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (transitioning) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>("[data-book-id]");
    if (!link) return;
    if (link.getAttribute("aria-hidden") === "true") { link.blur(); return; }
    if (!keyboardRef.current) return;
    clearTimer();
    select({ id: link.dataset.bookId!, row: Number(link.dataset.row), source: "keyboard" });
    if (galleryRef.current) revealFocusedBook(link, galleryRef.current);
  };

  if (!hasBooks) return null;
  return (
    <div ref={galleryRef} role="group" aria-label="精选书籍" className={styles.gallery}
      data-running={available && !reduced && (transitioning || !selection)} data-active={Boolean(selection) && !transitioning}
      data-transitioning={transitioning}
      onPointerMove={onPointerMove} onPointerLeave={clearPointer} onPointerCancel={clearPointer}
      onPointerDownCapture={() => { keyboardRef.current = false; }}
      onMouseDownCapture={event => {
        // Decorative copies remain clickable, but must not take hidden keyboard focus.
        if ((event.target as Element).closest('[aria-hidden="true"][data-book-id]')) event.preventDefault();
      }}
      onFocusCapture={onFocus} onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) { clearTimer(); select(null); }
      }}>
      {rows.map((row, index) => <BookRow key={index} books={row} index={index} selection={transitioning ? null : selection}
        transitioning={transitioning} retainedId={retainedId}
        canonical={covered.length >= 3 || index === 0} onResize={onResize} />)}
    </div>
  );
}

function BookRow({ books, index, selection, canonical, onResize, transitioning, retainedId }: {
  books: CoverBook[]; index: number; selection: Selection | null; canonical: boolean; onResize: () => void;
  transitioning: boolean; retainedId?: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const row = rowRef.current;
    const track = trackRef.current;
    const group = track?.firstElementChild;
    if (!row || !track || !group) return;
    let previousDistance = 0;
    let previousWidth = 0;
    const measure = () => {
      const distance = group.getBoundingClientRect().width;
      const width = row.clientWidth;
      if (!distance || !width || (distance === previousDistance && width === previousWidth)) return;
      const animation = track.getAnimations?.()[0];
      const progress = animation?.effect?.getComputedTiming().progress;
      track.style.setProperty("--book-row-distance", `${distance}px`);
      track.style.setProperty("--book-row-duration", `${distance / SPEED}s`);
      if (previousDistance && animation && progress !== null && progress !== undefined) {
        setPhase(animation, index === 1 ? 1 - progress : progress, distance / SPEED * 1000, ROW_STARTS[index]);
        onResize();
      }
      previousDistance = distance;
      previousWidth = width;
      setCopies(Math.max(2, Math.ceil(width / distance) + 1));
      setReady(true);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    observer.observe(group);
    measure();
    return () => observer.disconnect();
  }, [books, index, onResize]);

  return (
    <div ref={rowRef} className={styles.row} data-book-row={index} data-selected-row={selection?.row === index}>
      <div ref={trackRef} className={styles.track} data-book-track data-ready={ready}
        style={{
          "--book-row-distance": `calc((var(--book-width) + var(--book-gap)) * ${books.length})`,
          "--book-row-duration": `${books.length * 120 / SPEED}s`,
          "--book-row-start": ROW_STARTS[index],
        } as CSSProperties}>
        {Array.from({ length: copies }, (_, copy) => (
          <div key={copy} className={styles.sequence}>
            {books.map((book, bookIndex) => {
              const id = `${index}:${copy}:${book.slug}`;
              const duplicate = copy > 0 || !canonical;
              return (
                <EnterListLink key={book.slug} listHref="/" href={readingBookHref(book.slug, { view: "home" })} prefetch={false} scroll={false}
                  aria-label={book.title + (book.author ? ` · ${book.author}` : "")}
                  aria-hidden={duplicate || transitioning || undefined} tabIndex={duplicate || transitioning ? -1 : undefined}
                  data-book-id={id} data-book-slug={book.slug} data-retained={retainedId === id}
                  data-row={index} data-selected={selection?.id === id}
                  className={styles.book}>
                  <Image src={buildSrc(book.cover!, "portrait")} width={104} height={156} alt=""
                    loading="lazy" draggable={false} revealIndex={copy === 0 ? bookIndex : undefined}
                    className={styles.cover} />
                  <span aria-hidden className={styles.veil} />
                </EnterListLink>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
