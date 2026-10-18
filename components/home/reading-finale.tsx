"use client";

import Image from "next/image";
import { motion, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { EnterListLink } from "@/components/layout/list-return";
import { readingBookHref } from "@/lib/navigation/reading";
import { buildSrc } from "@/lib/oss";
import type { SceneBook } from "./use-reading-scene";
import styles from "./reading-finale.module.css";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const spring = { stiffness: 220, damping: 22, mass: .65 };

export function ReadingFinale({ book, width, ready, reduced }: {
  book: SceneBook; width: number; ready: boolean; reduced: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const method = useRef("keyboard");
  const suppressFocus = useRef(false);
  const [active, setActive] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [compact, setCompact] = useState(false);
  const [geometry, setGeometry] = useState({ width: 0, height: 0 });
  const [failed, setFailed] = useState(false);
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);
  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);
  const animated = ready && !compact && !reduced;
  const rotation = Array.from(book.slug).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 2 ? -3 : 3;
  const notes = book.highlights;
  const cancel = useCallback(() => clearTimeout(timer.current), []);
  const close = useCallback(() => {
    cancel();
    if (root.current?.querySelector("[data-highlight-note]:focus")) {
      suppressFocus.current = true; cover.current?.focus({ preventScroll: true }); suppressFocus.current = false;
    }
    drawer.current?.close();
    setActive(false); setExpanded(null);
  }, [cancel]);
  const open = (index: number | null = null) => {
    if (!ready || !notes.length) return;
    cancel(); setActive(true); setExpanded(index);
  };
  const leave = (event: ReactPointerEvent<HTMLElement>) => {
    if (compact || event.pointerType !== "mouse") return;
    cancel(); timer.current = setTimeout(close, 240);
  };
  const reset = () => { x.set(0); y.set(active && animated ? -6 : 0); rotateX.set(0); rotateY.set(0); };
  const follow = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!animated || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = clamp((event.clientX - bounds.left) / bounds.width - .5, -.5, .5);
    const vertical = clamp((event.clientY - bounds.top) / bounds.height - .5, -.5, .5);
    x.set(horizontal * 20); y.set(vertical * 16 - 6); rotateX.set(-vertical * 10); rotateY.set(horizontal * 12);
  };

  useEffect(() => {
    x.set(0); y.set(active && animated ? -6 : 0); rotateX.set(0); rotateY.set(0);
  }, [active, animated, x, y, rotateX, rotateY]);
  useEffect(() => { if (!ready) close(); }, [ready, close]);
  useEffect(() => { close(); }, [compact, close]);
  useEffect(() => {
    const dialog = drawer.current;
    if (!compact || !active || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, [compact, active]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = window.matchMedia("(max-width: 859px), (max-height: 639px), (hover: none), (pointer: coarse)");
    const measure = () => {
      setGeometry({ width: element.clientWidth, height: element.clientHeight });
      setCompact(media.matches);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element); media.addEventListener("change", measure); measure();
    return () => { cancel(); observer.disconnect(); media.removeEventListener("change", measure); };
  }, [cancel, close]);
  useEffect(() => {
    const pointer = (event: PointerEvent) => {
      method.current = event.pointerType === "touch" ? "touch" : "pointer";
      if (drawer.current?.open) return;
      if (!root.current?.contains(event.target as Node) || !(event.target as Element).closest("button, a")) close();
    };
    const keyboard = (event: KeyboardEvent) => {
      method.current = "keyboard";
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => { document.removeEventListener("pointerdown", pointer, true); document.removeEventListener("keydown", keyboard, true); };
  }, [close]);

  const artwork = <motion.span className={styles.coverArtwork}
    style={{ x, y, rotateX, rotateY, transformPerspective: 700 }} initial={false}
    animate={{ scale: active && animated ? 1.07 : 1, rotate: active && animated ? -rotation * .75 : 0 }}
    transition={reduced ? { duration: 0 } : { type: "spring", ...spring }}>
    {failed ? <span className={styles.fallback}>{book.title}</span> : <Image src={buildSrc(book.cover!, "portrait")}
      width={104} height={156} alt="" draggable={false} loading="eager" onError={() => setFailed(true)} />}
    <span className={styles.veil} />
  </motion.span>;

  const renderNotes = (mobile: boolean) => notes.map((text, index) => {
    const enlarged = expanded === index;
    const angle = -Math.PI / 2 + index * Math.PI * 2 / notes.length;
    const cardWidth = enlarged ? 320 : 184;
    const radiusX = Math.min(228, geometry.width * .19);
    const radiusY = Math.min(220, Math.max(0, geometry.height - 96) * .36);
    const center = { x: geometry.width / 2, y: geometry.height / 2 };
    const cardX = clamp(center.x + Math.cos(angle) * radiusX, cardWidth / 2 + 12, geometry.width - cardWidth / 2 - 12);
    const baseY = clamp(center.y + Math.sin(angle) * radiusY, 86, geometry.height - 86);
    const anchor = Math.sin(angle) < -.25 ? "top" : Math.sin(angle) > .25 ? "bottom" : "center";
    const cardY = anchor === "center" ? baseY : baseY + (anchor === "top" ? -74 : 74);
    return <motion.button key={index} type="button" className={styles.note}
      data-highlight-note={index} data-expanded={enlarged} data-anchor={anchor}
      aria-expanded={enlarged} aria-label={`划线 ${index + 1}：${text}`} tabIndex={active && ready ? 0 : -1}
      initial={false} animate={{ width: mobile ? "100%" : cardWidth, height: mobile || enlarged ? "auto" : 148,
        ...(mobile ? { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 } : !active ? {
          opacity: 0, x: center.x, y: center.y, scale: .25, rotate: 0,
        } : { opacity: 1, x: cardX, y: cardY, scale: enlarged ? 1.04 : 1, rotate: enlarged ? 0 : (index % 2 === 0 ? -1 : 1) * (4 + index % 3 * 2) }) }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 270, damping: 25, mass: .75 }}
      style={{ zIndex: enlarged ? 30 : 10 + index, pointerEvents: active && ready ? "auto" : "none" }}
      onPointerEnter={event => { if (event.pointerType === "mouse" && !mobile) { method.current = "pointer"; open(index); } }}
      onPointerLeave={leave} onPointerCancel={leave} onFocus={() => { if (method.current === "keyboard") open(index); }}
      onClick={() => open(index)} onKeyDown={event => {
        if (!enlarged || !["ArrowDown", "ArrowUp"].includes(event.key)) return;
        event.preventDefault(); event.currentTarget.querySelector("[data-note-text]")?.scrollBy({ top: event.key === "ArrowDown" ? 60 : -60 });
      }}>
      <span className="mb-3 block font-sans text-annotation tracking-normal text-muted">{String(index + 1).padStart(2, "0")} / 划线</span>
      <span className={styles.noteCopy} aria-hidden="true">
        <span className={`${styles.notePreview} font-sans text-body`}>{text}</span>
        <span data-note-text className={`${styles.noteText} font-sans text-body`}>{text}</span>
      </span>
    </motion.button>;
  });

  return <div ref={root} className={styles.layer} data-reading-focus={book.slug} data-ready={ready} data-open={active}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
    <div className={styles.bookMain} style={{ width: `var(--focus-width, ${width}px)` }}>
      {notes.length > 0 ? <button ref={cover} type="button" className={styles.cover} data-reading-focus-control
        aria-label={`展开《${book.title}》的划线笔记`} aria-expanded={active} aria-controls={`reading-notes-${book.slug}`}
        tabIndex={ready ? 0 : -1}
        onPointerEnter={event => { if (event.pointerType === "mouse" && !compact) { method.current = "pointer"; open(); follow(event); } }}
        onPointerMove={follow} onPointerLeave={event => { reset(); leave(event); }} onPointerCancel={event => { reset(); leave(event); }}
        onFocus={() => { if (!compact && !suppressFocus.current && method.current === "keyboard") open(); }}
        onClick={() => open()}>{artwork}</button>
        : <EnterListLink listHref="/" href={readingBookHref(book.slug, { view: "home" })} scroll={false} prefetch={false}
          className={styles.cover} data-reading-focus-control tabIndex={ready ? 0 : -1} aria-label={`查看《${book.title}》`}>{artwork}</EnterListLink>}
      <div className={styles.peekCards} aria-hidden data-hidden={active}>
        {notes.slice(0, 4).map((text, index) => <span key={index} className={styles.peekCard} data-note-index={index}><span>{text}</span></span>)}
      </div>
    </div>
    {!compact && <div id={`reading-notes-${book.slug}`} className={styles.notes} role="region"
      aria-label={`《${book.title}》的划线笔记`} aria-hidden={!active}>{renderNotes(false)}</div>}
    {compact && notes.length > 0 && <dialog ref={drawer} id={`reading-notes-${book.slug}`} className={styles.drawer}
      aria-label={`《${book.title}》的划线笔记`} onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}>
      <div className={styles.drawerHead}><p>{book.title}</p><button type="button" onClick={close} aria-label="关闭划线笔记">关闭</button></div>
      <div className={styles.mobileNotes}>{renderNotes(true)}</div>
    </dialog>}
  </div>;
}
