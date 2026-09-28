"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

type ImageState = "pending" | "ready" | "error";

/** Cached images and slow decodes follow the same path; failed images remain visible. */
export function observeImage(image: HTMLImageElement, onState: (state: ImageState) => void) {
  let active = true;
  const loaded = async () => {
    const source = image.currentSrc || image.src;
    try { await image.decode(); } catch { /* Some browsers cannot decode SVGs explicitly. */ }
    if (active && source === (image.currentSrc || image.src)) {
      onState(image.naturalWidth > 0 ? "ready" : "error");
    }
  };
  const failed = () => { if (active) onState("error"); };
  image.addEventListener("load", loaded);
  image.addEventListener("error", failed);
  if (image.complete) {
    if (image.naturalWidth > 0) void loaded();
    else if (image.currentSrc || image.getAttribute("src")) failed();
  }
  return () => {
    active = false;
    image.removeEventListener("load", loaded);
    image.removeEventListener("error", failed);
  };
}

function useImageReveal() {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<ImageState>("pending");
  useEffect(() => {
    if (ref.current) return observeImage(ref.current, setState);
  }, []);
  return { ref, "data-image-state": state };
}

function NextImage({ className = "", alt, ...props }: ImageProps) {
  const reveal = useImageReveal();
  return <Image {...props} alt={alt} {...reveal} className={`image-reveal ${className}`} />;
}

export function RevealImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "default" in props.src ? props.src.default.src : props.src.src;
  return <NextImage key={src} {...props} />;
}

type NativeImageProps = ImgHTMLAttributes<HTMLImageElement>;

function NativeImage({ className = "", alt = "", ...props }: NativeImageProps) {
  const reveal = useImageReveal();
  // Native images preserve intrinsic sizing in the lightbox, book covers and photo album.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt} {...reveal} className={`image-reveal ${className}`} />;
}

export function RevealImg(props: NativeImageProps) {
  return <NativeImage key={`${props.src ?? ""}|${props.srcSet ?? ""}`} {...props} />;
}
