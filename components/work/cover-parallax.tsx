"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { arriveCoverTransition } from "./cover-transition";

export function CoverParallax({ children, slug }: { children: ReactNode; slug: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const header = ref.current?.closest("header");
    if (header) return arriveCoverTransition(header, slug);
  }, [slug]);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Start only as the cover leaves the viewport, so no extra crop is needed.
  const y = useTransform(scrollYProgress, progress => `calc(var(--work-cover-travel) * ${progress})`);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 [--work-cover-travel:24%] md:[--work-cover-travel:40%]">
      <motion.div className="absolute inset-0 motion-reduce:!transform-none" style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
