"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { RevealImg } from "@/components/media/reveal-image";
import { observeImageMaskReveal } from "@/components/media/image-mask-reveal";
import revealStyles from "@/components/media/image-mask-reveal.module.css";
import { buildSrc } from "@/lib/oss";
import { PhotoLightbox } from "./photo-lightbox";
import type { Photo } from "@/lib/works/types";
import styles from "./plates-grid.module.css";

function PlateImage({ photo, alt, index, active }: { photo: Photo; alt: string; index: number; active: boolean }) {
  const frameRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const button = frame?.closest("button");
    if (!frame || !button) return;
    return observeImageMaskReveal(frame, button, `photo:${photo.key}`, active);
  }, [photo.key, active]);

  return <span ref={frameRef} className={`${styles.imageFrame} ${revealStyles.frame}`}>
    <RevealImg
      src={buildSrc(photo.key, "detail")}
      alt={alt}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      decoding="async"
      data-photo-index={index}
      className={`${styles.image} ${revealStyles.image}`}
      style={{ visibility: active ? "hidden" : undefined }}
    />
  </span>;
}

export function PlatesGrid({ photos, workTitle, film = false }: {
  photos: Photo[];
  workTitle: string;
  film?: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const albumRef = useRef<HTMLDivElement>(null);
  const isOpen = activeIdx !== null;
  const close = useCallback(() => setActiveIdx(null), []);
  const getThumbnail = useCallback((index: number) => albumRef.current?.querySelector<HTMLImageElement>(`img[data-photo-index="${index}"]`) ?? null, []);
  const open = useCallback((index: number) => {
    // 灯箱在渲染时测量缩略图，先结束揭幕缩放，保证取到原始边界。
    const button = getThumbnail(index)?.closest("button");
    if (button) button.dataset.workReveal = "seen";
    setActiveIdx(index);
  }, [getThumbnail]);
  const prev = useCallback(
    () => { if (activeIdx !== null) open((activeIdx - 1 + photos.length) % photos.length); },
    [activeIdx, photos.length, open]
  );
  const next = useCallback(
    () => { if (activeIdx !== null) open((activeIdx + 1) % photos.length); },
    [activeIdx, photos.length, open]
  );

  useLayoutEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) document.body.style.paddingRight = `${(parseFloat(getComputedStyle(document.body).paddingRight) || 0) + scrollbar}px`;
    document.body.style.overflow = "hidden";
    document.body.dataset.lightboxOpen = "true";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      delete document.body.dataset.lightboxOpen;
    };
  }, [isOpen]);

  return <>
    <div ref={albumRef} className={styles.album} data-photo-album data-film={film} role="group" aria-label={`${workTitle} 照片`}>
      {photos.map((photo, index) => {
        const alt = photo.caption ?? `${workTitle} plate ${index + 1}`;
        const portrait = photo.width && photo.height ? photo.height > photo.width : false;
        return <div key={photo.key} className={styles.row} data-align={index % 2 ? "right" : "left"} data-orientation={portrait ? "portrait" : "landscape"}>
          <figure className={styles.plate}>
            <button type="button" className={`${styles.photo} ${revealStyles.entry}`} aria-label={`查看 ${alt}`} onClick={() => open(index)}>
              {film && <span className="film-sprockets block" aria-hidden />}
              <PlateImage photo={photo} alt={alt} index={index} active={activeIdx === index} />
            </button>
            {film && <figcaption>
              <div className={styles.caption}><span>{String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span><span>Silence · Film archive</span></div>
              <div className="film-sprockets" aria-hidden />
            </figcaption>}
          </figure>
        </div>;
      })}
    </div>
    {isOpen && <PhotoLightbox
      src={buildSrc(photos[activeIdx!].key, "hero")}
      previewSrc={buildSrc(photos[activeIdx!].key, "detail")}
      alt={photos[activeIdx!].caption ?? `${workTitle} plate ${activeIdx! + 1}`}
      width={photos[activeIdx!].width}
      height={photos[activeIdx!].height}
      index={activeIdx!}
      total={photos.length}
      getThumbnail={getThumbnail}
      preloadSrcs={photos.length > 1 ? [buildSrc(photos[(activeIdx! + 1) % photos.length].key, "hero"), buildSrc(photos[(activeIdx! - 1 + photos.length) % photos.length].key, "hero")] : []}
      onClose={close}
      onPrev={photos.length > 1 ? prev : undefined}
      onNext={photos.length > 1 ? next : undefined}
    />}
  </>;
}
