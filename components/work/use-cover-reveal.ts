"use client";

import { useLayoutEffect, useRef } from "react";
import { arriveCoverTransition } from "./cover-transition";

const revealedCovers = new Set<string>();

export function useCoverReveal(slug: string) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) return arriveCoverTransition(ref.current, slug, "return");
  }, [slug]);

  useLayoutEffect(() => {
    const cover = ref.current;
    const entry = cover?.closest<HTMLElement>("[data-work-entry]");
    const image = cover?.querySelector("img");
    if (!cover || !entry || !image) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (cover.dataset.coverArriving) revealedCovers.add(slug);
    if (revealedCovers.has(slug) || reduce.matches || typeof IntersectionObserver === "undefined") {
      entry.dataset.workReveal = "seen";
      return;
    }

    let visible = false;
    let finished = false;
    const show = () => {
      if (finished) return;
      finished = true;
      entry.dataset.workReveal = "visible";
      revealedCovers.add(slug);
      observer.disconnect();
      images.disconnect();
    };
    const ready = () => {
      if (visible && ["ready", "seen", "error"].includes(image.dataset.imageState ?? "")) show();
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(item => item.isIntersecting)) { visible = true; ready(); }
    }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
    const images = new MutationObserver(ready);
    const motionChange = () => { if (reduce.matches) show(); };

    entry.dataset.workReveal = "pending";
    images.observe(image, { attributes: true, attributeFilter: ["data-image-state"] });
    observer.observe(cover.parentElement ?? cover);
    entry.addEventListener("focusin", show);
    reduce.addEventListener("change", motionChange);
    return () => {
      observer.disconnect();
      images.disconnect();
      entry.removeEventListener("focusin", show);
      reduce.removeEventListener("change", motionChange);
    };
  }, [slug]);

  return ref;
}
