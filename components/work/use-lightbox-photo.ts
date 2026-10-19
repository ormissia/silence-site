"use client";

import { useEffect, useState } from "react";

export type LightboxPhotoSource = { src: string; previewSrc: string; alt: string; index: number; width: number; height: number };

/** Keep the visible photo until at least one version of the requested photo is decoded. */
export function useLightboxPhoto(requested: LightboxPhotoSource, enabled: boolean) {
  const [displayed, setDisplayed] = useState(requested);
  const [failed, setFailed] = useState(false);
  const { src, previewSrc, alt, index, width, height } = requested;

  useEffect(() => {
    if (!enabled || src === displayed.src) return;
    let active = true;
    let errors = 0;
    const urls = [...new Set([previewSrc, src])];
    const images: HTMLImageElement[] = [];
    setFailed(false);
    const fail = () => { if (active && ++errors === urls.length) setFailed(true); };
    const timeout = window.setTimeout(() => { if (active) setFailed(true); }, 12000);
    for (const url of urls) {
      const image = new window.Image();
      images.push(image);
      image.decoding = "async";
      const reveal = async () => {
        try { await image.decode?.(); } catch { /* A successfully loaded fallback can still be displayed. */ }
        if (!active) return;
        if (!image.naturalWidth) { fail(); return; }
        active = false;
        clearTimeout(timeout);
        setDisplayed({ src, previewSrc: url, alt, index, width, height });
        setFailed(false);
      };
      image.onload = reveal;
      image.onerror = fail;
      image.src = url;
      if (image.complete && image.naturalWidth) void reveal();
    }
    return () => {
      active = false;
      clearTimeout(timeout);
      images.forEach(image => { image.onload = null; image.onerror = null; });
    };
  }, [src, previewSrc, alt, index, width, height, displayed.src, enabled]);

  return { displayed, pending: enabled && displayed.src !== src, failed };
}
