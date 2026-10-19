"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RevealImg } from "@/components/media/reveal-image";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import { buildSrc } from "@/lib/oss";
import { groupAlbumPhotos } from "@/lib/works/photo-layout";
import { PhotoLightbox } from "./photo-lightbox";
import type { Photo } from "@/lib/works/types";
import styles from "./plates-grid.module.css";

export function PlatesGrid({ photos, workTitle, film = false }: {
  photos: Photo[];
  workTitle: string;
  film?: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const albumRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const isOpen = activeIdx !== null;
  const close = useCallback(() => setActiveIdx(null), []);
  const prev = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );
  const next = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    const element = albumRef.current;
    if (!element) return;
    const measure = () => setContainerWidth(element.clientWidth);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.lightboxOpen = "true";
    return () => {
      document.body.style.overflow = prevOverflow;
      delete document.body.dataset.lightboxOpen;
    };
  }, [isOpen]);

  const albumPhotos = photos.map((photo, originalIndex) => ({
    ...photo,
    width: photo.width!,
    height: photo.height!,
    src: buildSrc(photo.key, "detail"),
    alt: photo.caption ?? `${workTitle} plate ${originalIndex + 1}`,
    originalIndex,
  }));

  const filmCaption = (index: number) => <>
    <div className={styles.caption}><span>{String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span><span>Silence · Film archive</span></div>
    <div className="film-sprockets" aria-hidden />
  </>;

  return <>
    <div ref={albumRef} className={styles.album} data-photo-album data-film={film}>
      {groupAlbumPhotos(albumPhotos, containerWidth).map((group) => {
        const first = group[0];
        return <RowsPhotoAlbum key={first.key} photos={group} targetRowHeight={380}
          spacing={width => width < 640 ? 36 : 40}
          rowConstraints={width => ({ maxPhotos: width < 640 ? 1 : 3 })}
          componentsProps={containerWidth => ({
            container: { className: styles.rows },
            track: { style: { justifyContent: "center", gap: (containerWidth ?? 0) < 640 ? 36 : 40 } },
            button: ({ photo, width }) => ({
              "aria-label": `查看 ${photo.alt}`,
              style: { maxWidth: (containerWidth ?? 0) >= 640
                ? Math.min(width, (group.length === 1 ? 560 : 460) * photo.width / photo.height) : undefined },
            }),
          })}
          render={{ image: (props, { photo }) => <>
            {film && <div className="film-sprockets" aria-hidden />}
            <RevealImg {...props} revealIndex={photo.originalIndex} />
            {film && filmCaption(photo.originalIndex)}
          </> }}
          onClick={({ photo }) => setActiveIdx(photo.originalIndex)} />;
      })}
    </div>
    {isOpen && <PhotoLightbox
      src={buildSrc(photos[activeIdx!].key, "hero")}
      alt={photos[activeIdx!].caption ?? `${workTitle} plate ${activeIdx! + 1}`}
      onClose={close}
      onPrev={photos.length > 1 ? prev : undefined}
      onNext={photos.length > 1 ? next : undefined}
    />}
  </>;
}
