"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./photo-lightbox.module.css";

export function LightboxPhoto({ src, previewSrc, alt }: { src: string; previewSrc: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const image = ref.current;
    if (!image) return;
    let active = true;
    const reveal = async () => {
      try { await image.decode?.(); } catch { /* The loaded preview remains underneath a failed full-size image. */ }
      if (!active) return;
      if (image.naturalWidth) setReady(true);
      else setFailed(true);
    };
    const fail = () => { if (active) setFailed(true); };
    image.addEventListener("load", reveal);
    image.addEventListener("error", fail);
    if (image.complete) void reveal();
    return () => {
      active = false;
      image.removeEventListener("load", reveal);
      image.removeEventListener("error", fail);
    };
  }, [src]);

  return <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className={styles.image} src={previewSrc} alt="" aria-hidden draggable={false} />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img ref={ref} className={`${styles.image} ${styles.fullImage}`} src={src} alt={alt} draggable={false}
      decoding="async" data-full-image data-ready={ready} />
    {failed && <span className={styles.loadNotice} role="status">原图暂时无法加载，正在显示预览</span>}
  </>;
}
