"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export function AboutScrollScene({ hero, children }: { hero: ReactNode; children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: contentRef,
    offset: ["start end", "end end"],
  });
  const shadeOpacity = useTransform(scrollYProgress, [0, 0.35, 1], [0, 0.22, 0.72]);

  return (
    <div className="relative isolate bg-paper">
      <div
        aria-hidden
        className="sticky top-[-3rem] z-0 h-[calc(100svh+3rem)] overflow-hidden md:top-[-16rem] md:h-[calc(100svh+16rem)]"
      >
        <div
          className="absolute inset-0 bg-cover bg-center brightness-[0.9] saturate-[0.85]"
          style={{ backgroundImage: "url('/images/background.jpg')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(4,8,13,0.46)_0%,rgba(4,8,13,0.12)_25%,rgba(8,9,11,0.12)_30%,#0C0C0C_95%)]" />
        <motion.div
          className="absolute inset-0 bg-paper"
          style={{ opacity: reducedMotion ? 0 : shadeOpacity }}
        />
      </div>
      <div className="relative z-10 -mt-[calc(100svh+3rem)] md:-mt-[calc(100svh+16rem)]">
        {hero}
        <div ref={contentRef}>{children}</div>
      </div>
    </div>
  );
}

export function AboutScrollReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "start 0.6"],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0.2, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [16, 0]);

  return (
    <motion.div ref={ref} style={reducedMotion ? undefined : { opacity, y }}>
      {children}
    </motion.div>
  );
}
