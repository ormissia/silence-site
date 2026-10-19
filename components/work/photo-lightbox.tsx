"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePhotoViewport } from "./use-photo-viewport";
import { fitPhoto, thumbnailFrame, type PhotoFrame } from "./lightbox-geometry";
import { LightboxPhoto } from "./lightbox-photo";
import { useLightboxPhoto } from "./use-lightbox-photo";
import styles from "./photo-lightbox.module.css";

interface PhotoLightboxProps {
  src: string;
  previewSrc: string;
  alt: string;
  width?: number;
  height?: number;
  index: number;
  total: number;
  getThumbnail: (index: number) => HTMLImageElement | null;
  preloadSrcs?: string[];
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

const ease = [.22, 1, .36, 1] as const;

export function PhotoLightbox({ src, previewSrc, alt, width, height, index, total, getThumbnail, preloadSrcs, onClose, onPrev, onNext }: PhotoLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closingRef = useRef(false);
  const [phase, setPhase] = useState<"opening" | "open" | "closing">("opening");
  const [direction, setDirection] = useState(0);
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [origin] = useState(() => thumbnailFrame(getThumbnail(index)));
  const [closingFrame, setClosingFrame] = useState<PhotoFrame>();
  const reduceMotion = useReducedMotion();
  const thumbnail = getThumbnail(index);
  const { displayed, pending, failed } = useLightboxPhoto({ src, previewSrc: thumbnail?.currentSrc || previewSrc, alt, index,
    width: width || thumbnail?.naturalWidth || 3, height: height || thumbnail?.naturalHeight || 2 }, phase !== "closing");
  const fitted = fitPhoto(displayed.width, displayed.height, size.width, size.height);

  function navigate(delta: number) {
    if (closingRef.current) return;
    setDirection(delta);
    if (delta < 0) onPrev?.();
    else onNext?.();
  }

  function requestClose() {
    if (closingRef.current) return;
    closingRef.current = true;
    const target = getThumbnail(displayed.index);
    const rect = target?.getBoundingClientRect();
    if (rect && (rect.bottom < 80 || rect.top > window.innerHeight - 80)) {
      target?.scrollIntoView({ block: "center", behavior: "instant" });
    }
    setClosingFrame(thumbnailFrame(getThumbnail(displayed.index)));
    viewport.resetView();
    setPhase("closing");
  }

  const viewport = usePhotoViewport({ src: displayed.src, onClose: requestClose,
    onPrev: onPrev ? () => navigate(-1) : undefined,
    onNext: onNext ? () => navigate(1) : undefined });
  const scale = phase === "closing" ? 1 : viewport.scale;
  const position = phase === "closing" ? { x: 0, y: 0 } : viewport.position;
  const isDragging = phase !== "closing" && viewport.isDragging;

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); dialog?.close(); };
  }, []);

  useEffect(() => {
    for (const url of new Set(preloadSrcs)) {
      const image = new window.Image();
      image.decoding = "async";
      image.src = url;
    }
  }, [preloadSrcs]);

  const finish = () => {
    if (phase === "opening") setPhase("open");
    else if (phase === "closing") {
      const button = getThumbnail(displayed.index)?.closest("button");
      dialogRef.current?.close();
      onClose();
      queueMicrotask(() => button?.focus({ preventScroll: true }));
    }
  };
  const slide = {
    enter: (value: number) => ({ x: reduceMotion ? 0 : value * 72, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (value: number) => ({ x: reduceMotion ? 0 : value * -72, opacity: 0 }),
  };

  return createPortal(
    <dialog ref={dialogRef} className={styles.dialog} aria-label={displayed.alt} aria-modal="true"
      onCancel={event => { event.preventDefault(); requestClose(); }}>
      <div ref={viewport.containerRef} className={styles.viewport} data-photo-lightbox data-phase={phase}
        onClick={event => { if (event.target === event.currentTarget && scale === 1) requestClose(); }}
        onMouseMove={viewport.handleMouseMove} onMouseUp={viewport.handleMouseUp} onMouseLeave={viewport.handleMouseUp}>
        <motion.div className={styles.backdrop} initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: phase === "closing" ? 0 : 1 }} transition={{ duration: reduceMotion ? 0 : .36 }} />

        <motion.div className={styles.frame} data-lightbox-frame
          initial={{ ...(reduceMotion ? fitted : origin ?? fitted), opacity: origin || reduceMotion ? 1 : 0, borderRadius: 4 }}
          animate={{ ...(phase === "closing" ? closingFrame ?? fitted : fitted),
            opacity: phase === "closing" && !closingFrame ? 0 : 1, borderRadius: phase === "closing" ? 4 : 12 }}
          transition={{ duration: reduceMotion ? 0 : phase === "closing" ? .36 : .46, ease }}
          onAnimationComplete={finish} onClick={event => event.stopPropagation()}
          onTouchStart={viewport.handleTouchStart} onTouchMove={viewport.handleTouchMove} onTouchEnd={viewport.handleTouchEnd}>
          <div className={styles.zoom} onMouseDown={viewport.handleMouseDown}
            style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              transition: isDragging || reduceMotion ? "none" : `transform ${phase === "closing" ? 360 : 200}ms ease-out` }}>
            <AnimatePresence initial={false} custom={direction}>
              <motion.div key={displayed.src} className={styles.slide} custom={direction} variants={slide}
                initial="enter" animate="center" exit="exit" transition={{ duration: reduceMotion ? 0 : .28, ease }}>
                <LightboxPhoto src={displayed.src} previewSrc={displayed.previewSrc} alt={displayed.alt} />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div className={styles.controls} initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: phase === "closing" ? 0 : 1 }} transition={{ duration: reduceMotion ? 0 : .2 }}>
          <span className={styles.counter} aria-live="polite" aria-atomic="true">{displayed.index + 1} / {total}</span>
          {pending && <span className={styles.pending} role="status">{failed ? "这张照片暂时无法加载" : "正在载入照片…"}</span>}
          <button autoFocus className={`${styles.button} ${styles.close}`} onClick={requestClose} aria-label="关闭" title="关闭 (Esc)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          {onPrev && <button className={`${styles.button} ${styles.previous}`} disabled={phase === "closing"}
            onClick={() => { viewport.resetView(); navigate(-1); }} aria-label="上一张">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 18-6-6 6-6" /></svg>
          </button>}
          {onNext && <button className={`${styles.button} ${styles.next}`} disabled={phase === "closing"}
            onClick={() => { viewport.resetView(); navigate(1); }} aria-label="下一张">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m9 18 6-6-6-6" /></svg>
          </button>}
          <div className={styles.toolbar} role="group" aria-label="图片缩放">
            <button className={styles.button} disabled={phase === "closing"} onClick={viewport.handleZoomOut} aria-label="缩小" title="缩小 (-)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6M7 10h6" /></svg>
            </button>
            <span className={styles.percentage}>{Math.round(scale * 100)}%</span>
            <button className={styles.button} disabled={phase === "closing"} onClick={viewport.handleZoomIn} aria-label="放大" title="放大 (+)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6M7 10h6M10 7v6" /></svg>
            </button>
            <button className={styles.button} disabled={phase === "closing"} onClick={viewport.resetView} aria-label="适应屏幕" title="适应屏幕 (0)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /></svg>
            </button>
            <button className={styles.button} disabled={phase === "closing"} onClick={viewport.handleZoom100} aria-label="100%" title="100% (1)">1:1</button>
          </div>
        </motion.div>
      </div>
    </dialog>, document.body
  );
}
