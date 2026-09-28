"use client";

import { useEffect, useRef } from "react";
import { observeImage } from "./reveal-image";

/** Markdown images use the same load/decode lifecycle as React image components. */
export function ImageContent({ html, className = "" }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cleanups = Array.from(ref.current?.querySelectorAll("img") ?? []).map((image) => {
      image.classList.add("image-reveal");
      image.dataset.imageState = "pending";
      return observeImage(image, (state) => { image.dataset.imageState = state; });
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [html]);
  return <div ref={ref} className={`image-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
