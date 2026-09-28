"use client";

import { useEffect, useRef } from "react";
import { imageRevealDelay, observeImage } from "./image-reveal";

/** Markdown images use the same load/decode lifecycle as React image components. */
export function ImageContent({ html, className = "" }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cleanups = Array.from(ref.current?.querySelectorAll("img") ?? []).map((image, index) => {
      image.classList.add("image-reveal");
      image.dataset.imageState = "pending";
      image.style.setProperty("--image-reveal-delay", imageRevealDelay(index));
      return observeImage(image, (state) => { image.dataset.imageState = state; }, true);
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [html]);
  return <div ref={ref} className={`image-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
