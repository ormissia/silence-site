"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type ImgHTMLAttributes } from "react";

import { previewSrcFor } from "@/lib/oss";
import { imageRevealDelay, observeImage, type ImageState } from "./image-reveal";

type RevealOptions = { revealIndex?: number; revealEffect?: "fade" | "blur" };

function useImageReveal(staggered: boolean) {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<ImageState>("pending");
  useEffect(() => {
    if (ref.current) return observeImage(ref.current, setState, staggered);
  }, [staggered]);
  return { ref, "data-image-state": state };
}

function NextImage({ className = "", alt, style, revealIndex, revealEffect = "fade", ...props }: ImageProps & RevealOptions) {
  const reveal = useImageReveal(revealIndex !== undefined);
  const delay = useRef(imageRevealDelay(revealIndex)).current;
  const preview = typeof props.src === "string" && props.fill && revealIndex !== undefined && revealEffect === "fade"
    ? previewSrcFor(props.src)
    : undefined;
  return <>
    {preview && (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={preview} alt="" aria-hidden="true" loading="lazy" decoding="async"
        className="image-blur-placeholder"
        style={{ objectFit: className.includes("object-contain") ? "contain" : "cover" }} />
    )}
    <Image {...props} alt={alt} {...reveal} data-image-effect={revealEffect} style={{ ...style, "--image-reveal-delay": delay } as CSSProperties} className={`image-reveal ${className}`} />
  </>;
}

export function RevealImage(props: ImageProps & RevealOptions) {
  const src = typeof props.src === "string" ? props.src : "default" in props.src ? props.src.default.src : props.src.src;
  return <NextImage key={src} {...props} />;
}

type NativeImageProps = ImgHTMLAttributes<HTMLImageElement> & RevealOptions;

function NativeImage({ className = "", alt = "", style, revealIndex, revealEffect = "fade", ...props }: NativeImageProps) {
  const reveal = useImageReveal(revealIndex !== undefined);
  const delay = useRef(imageRevealDelay(revealIndex)).current;
  // Native images preserve intrinsic sizing in the lightbox, book covers and photo album.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt} {...reveal} data-image-effect={revealEffect} style={{ ...style, "--image-reveal-delay": delay } as CSSProperties} className={`image-reveal ${className}`} />;
}

export function RevealImg(props: NativeImageProps) {
  return <NativeImage key={`${props.src ?? ""}|${props.srcSet ?? ""}`} {...props} />;
}
