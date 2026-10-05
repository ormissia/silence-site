"use client";

import { useCallback, useEffect, useState } from "react";
import { RevealImage as Image, RevealImg } from "@/components/media/reveal-image";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import { buildSrc } from "@/lib/oss";
import { PhotoLightbox } from "./photo-lightbox";
import type { Photo } from "@/lib/works/types";

/**
 * 详情页大图浏览组件。
 *
 * 网格部分：Justified Layout（react-photo-album rows 模式）。
 *   每张图按真实宽高比例排版，行高一致——横竖混排不裁切、不留白。
 *   尺寸来自 lib/image-meta.ts 的 OSS 探测缓存（构建期注入到 Photo.width/height）。
 *
 * Lightbox 部分：移植自 ormissia-album 的 Lightbox 风格——
 *   - 顶部居中工具条（缩小 / 百分比 / 放大 / 适应 / 1:1）
 *   - 右上关闭、左右箭头切换
 *   - 滚轮缩放、按住拖拽平移、双指捏合 / 双指滑动
 *   - 键盘 esc / ← / → / +/- / 0 / 1
 *   - 底部居中快捷键提示
 */

// 缺失尺寸时的兜底比例（横图 3:2）。理论上 image-meta 会补齐，
// 但探测失败 / demo 模式仍可能落到这里——给个安全默认避免布局炸。
const FALLBACK_W = 3;
const FALLBACK_H = 2;

export function PlatesGrid({
  photos,
  workTitle,
  film = false,
}: {
  photos: Photo[];
  workTitle: string;
  film?: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
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

  // 滚动锁定 + 通知 header 隐藏
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

  const albumPhotos = photos.map((p, i) => ({
    src: buildSrc(p.key, "detail"),
    width: p.width ?? FALLBACK_W,
    height: p.height ?? FALLBACK_H,
    key: p.key,
    alt: p.caption ?? `${workTitle} plate ${i + 1}`,
  }));

  return (
    <>
      {film ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {albumPhotos.map((photo, index) => (
            <button key={photo.key} type="button" onClick={() => setActiveIdx(index)} aria-label={`查看 ${photo.alt}`}
              className="image-frame group overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
              <div className="film-sprockets" aria-hidden />
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image revealIndex={index} src={photo.src} alt={photo.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain transition-transform duration-700 motion-safe:group-hover:scale-[1.015]" />
              </div>
              <div className="flex items-center justify-between px-4 pt-2 text-[9px] uppercase tracking-[0.2em] text-accent/70"><span>{String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span><span>Silence · Film archive</span></div>
              <div className="film-sprockets" aria-hidden />
            </button>
          ))}
        </div>
      ) : (
      <RowsPhotoAlbum
        photos={albumPhotos}
        targetRowHeight={420}
        spacing={24}
        render={{ image: (props, { index }) => <RevealImg {...props} revealIndex={index} /> }}
        onClick={({ index }) => setActiveIdx(index)}
      />
      )}

      {isOpen && (
        <PhotoLightbox
          src={buildSrc(photos[activeIdx!].key, "hero")}
          alt={photos[activeIdx!].caption ?? `${workTitle} plate ${activeIdx! + 1}`}
          onClose={close}
          onPrev={photos.length > 1 ? prev : undefined}
          onNext={photos.length > 1 ? next : undefined}
        />
      )}
    </>
  );
}
