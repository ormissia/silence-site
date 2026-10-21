"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { CoverBook } from "./book-rows";
import { getLastListReturn } from "@/components/layout/list-return";

export type SceneBook = CoverBook & { highlights: string[] };
type FocusBook = { book: SceneBook; id: string; width: number; x: number; y: number };
type Snapshot = { books: SceneBook[]; phases: number[]; selectedId?: string; selectedSlug?: string; returnId: number };
let remembered: Snapshot | undefined;
const SNAPSHOT_KEY = "silence:reading-scene";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const SCENE_STOPS = { freeze: .35, center: .65, finish: .85 };

function returningSnapshot() {
  if (!remembered) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY) ?? "null") as Snapshot | null;
      if (saved && Array.isArray(saved.books) && saved.books.every(book => typeof book.slug === "string" && typeof book.title === "string" && Array.isArray(book.highlights) && book.highlights.every(text => typeof text === "string"))
        && Array.isArray(saved.phases) && saved.phases.every(Number.isFinite) && Number.isFinite(saved.returnId)) remembered = saved;
    } catch { /* A stale or unavailable snapshot does not prevent a fresh scene. */ }
  }
  const request = getLastListReturn();
  if (remembered && request?.href === "/" && request.id > remembered.returnId) return remembered;
  try { return sessionStorage.getItem("silence:return-to-list") === "/" ? remembered : undefined; }
  catch { return undefined; }
}

function duration(animation: Animation) {
  const value = Number(animation.effect?.getComputedTiming().duration);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function useReadingScene(root: RefObject<HTMLDivElement | null>, stage: RefObject<HTMLDivElement | null>, supplied: SceneBook[]) {
  const [restored] = useState(returningSnapshot);
  const [books] = useState(() => restored?.books ?? supplied);
  const [selected, setSelected] = useState<FocusBook>();
  const [transitioning, setTransitioning] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const locked = useRef<FocusBook | undefined>(undefined);
  const save = useRef<() => void>(() => {});
  const navigationSaved = useRef(false);

  useEffect(() => {
    const scene = root.current;
    const canvas = stage.current;
    if (!scene || !canvas || !books.length) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tracks = Array.from(canvas.querySelectorAll<HTMLElement>("[data-book-track]"));
    let frame = 0;
    let restoredPhases = false;
    let pendingRestore = restored;
    let lastRate = -1;
    let previousProgress = 0;
    let scrollingBack = false;
    let brakingStart = 0;
    let source: HTMLElement | undefined;

    const animations = () => tracks.map(track => track.getAnimations?.()[0]);
    const changeRate = (rate: number) => {
      if (rate === lastRate) return;
      const current = animations();
      current.forEach(animation => { if (animation) animation.playbackRate = rate; });
      if (current.every(Boolean)) lastRate = rate;
    };
    const choose = (slug?: string, id?: string): FocusBook | undefined => {
      const bounds = canvas.getBoundingClientRect();
      const center = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
      const links = Array.from(canvas.querySelectorAll<HTMLElement>('[data-book-row="1"] [data-book-id]'));
      const candidates = slug ? links.filter(link => link.dataset.bookSlug === slug) : links;
      source = candidates.find(link => link.dataset.bookId === id) ?? candidates.reduce<HTMLElement | undefined>((nearest, link) => {
        const rect = link.getBoundingClientRect();
        const previous = nearest?.getBoundingClientRect();
        return !previous || Math.abs(rect.left + rect.width / 2 - center.x) < Math.abs(previous.left + previous.width / 2 - center.x) ? link : nearest;
      }, undefined);
      if (!source) return;
      const book = books.find(book => book.slug === source!.dataset.bookSlug);
      const rect = source.getBoundingClientRect();
      if (!book || !rect.width) return;
      return { book, id: source.dataset.bookId!, width: rect.width, x: rect.left + rect.width / 2 - center.x, y: rect.top + rect.height / 2 - center.y };
    };
    save.current = () => {
      remembered = {
        books,
        phases: animations().map(animation => animation ? Number(animation.currentTime ?? 0) / duration(animation) % 1 : 0),
        selectedId: locked.current?.id,
        selectedSlug: locked.current?.book.slug,
        returnId: getLastListReturn()?.id ?? 0,
      };
      try { sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(remembered)); } catch { /* Keep the in-memory snapshot when storage is unavailable. */ }
    };

    const update = (resizing = false) => {
      frame = 0;
      if (!scene.isConnected || navigationSaved.current) return;
      if (!restoredPhases) {
        animations().forEach((animation, index) => {
          if (animation && restored?.phases[index] !== undefined) animation.currentTime = restored.phases[index] * duration(animation);
        });
        restoredPhases = true;
      }
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")) || 90;
      const travel = scene.offsetHeight - canvas.clientHeight;
      const progress = travel > 0 ? clamp((header - scene.getBoundingClientRect().top) / travel) : 0;
      if (!resizing && progress !== previousProgress) {
        const nextScrollingBack = progress < previousProgress;
        if (scrollingBack && !nextScrollingBack) brakingStart = Math.min(previousProgress, SCENE_STOPS.freeze);
        scrollingBack = nextScrollingBack;
      }
      previousProgress = progress;
      setReduced(media.matches);
      const staticScene = media.matches;
      setTransitioning(!staticScene && progress > SCENE_STOPS.freeze);
      const previousFocus = locked.current;

      if (!staticScene && progress <= SCENE_STOPS.freeze && !pendingRestore) {
        locked.current = undefined;
        source = undefined;
        setSelected(undefined);
        pendingRestore = undefined;
      } else if (!locked.current && (staticScene || progress >= SCENE_STOPS.freeze)) {
        changeRate(0);
        locked.current = choose(pendingRestore?.selectedSlug, pendingRestore?.selectedId);
        pendingRestore = undefined;
        setSelected(locked.current);
      } else if (resizing && locked.current) {
        locked.current = choose(locked.current.book.slug, locked.current.id) ?? locked.current;
        setSelected({ ...locked.current });
      }

      const brakingRange = SCENE_STOPS.freeze - brakingStart;
      const forwardRate = brakingRange > 0 ? clamp((SCENE_STOPS.freeze - progress) / brakingRange) ** 2 : 0;
      changeRate(staticScene || locked.current || pendingRestore?.selectedSlug ? 0 : scrollingBack ? 1 : forwardRate);
      const focus = locked.current ?? previousFocus;
      const settle = staticScene ? 1 : ease((progress - SCENE_STOPS.freeze) / (SCENE_STOPS.center - SCENE_STOPS.freeze));
      const peek = staticScene ? 1 : ease((progress - SCENE_STOPS.center) / (SCENE_STOPS.finish - SCENE_STOPS.center));
      const rotation = locked.current ? (Array.from(locked.current.book.slug).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 2 ? -3 : 3) : 0;
      scene.style.setProperty("--wall-opacity", String(staticScene ? 1 : 1 - settle));
      scene.style.setProperty("--focus-x", `${(focus?.x ?? 0) * (1 - settle)}px`);
      scene.style.setProperty("--focus-y", `${(focus?.y ?? 0) * (1 - settle)}px`);
      const viewportWidth = canvas.clientWidth;
      const columns = viewportWidth >= 1280 ? 8 : viewportWidth >= 1024 ? 7 : viewportWidth >= 768 ? 5 : viewportWidth >= 640 ? 3 : 2;
      const targetWidth = (Math.min(viewportWidth, 1400) - (viewportWidth >= 768 ? 96 : 48) + 20) / columns - 20;
      const startWidth = focus?.width ?? 104;
      scene.style.setProperty("--focus-width", `${startWidth + (Math.max(startWidth, targetWidth) - startWidth) * settle}px`);
      scene.style.setProperty("--cover-veil", String(.55 * (1 - settle)));
      scene.style.setProperty("--peek", String(peek));
      scene.style.setProperty("--book-rotation", `${staticScene ? 0 : rotation * peek}deg`);
      scene.dataset.progress = String(progress);
      setReady(staticScene || progress >= SCENE_STOPS.finish);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => update());
    };
    const resize = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => update(true));
    };
    const observer = new ResizeObserver(resize);
    const cancelRestore = () => { pendingRestore = undefined; };
    observer.observe(canvas);
    observer.observe(scene);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("wheel", cancelRestore, { passive: true });
    media.addEventListener("change", resize);
    schedule();
    return () => {
      if (!navigationSaved.current) save.current();
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", cancelRestore);
      media.removeEventListener("change", resize);
    };
  }, [books, restored, root, stage]);

  return { books, selected, transitioning, ready, reduced, save: () => { save.current(); navigationSaved.current = true; } };
}
