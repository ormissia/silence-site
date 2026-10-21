"use client";

import { useLayoutEffect, useRef } from "react";
import { observeImageMaskReveal } from "@/components/media/image-mask-reveal";
import { arriveCoverTransition } from "./cover-transition";

export function useCoverReveal(slug: string) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) return arriveCoverTransition(ref.current, slug, "return");
  }, [slug]);

  useLayoutEffect(() => {
    const cover = ref.current;
    const entry = cover?.closest<HTMLElement>("[data-work-entry]");
    if (!cover || !entry) return;
    return observeImageMaskReveal(cover, entry, `cover:${slug}`, Boolean(cover.dataset.coverArriving));
  }, [slug]);

  return ref;
}
