"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionStyle } from "framer-motion";
import { RevealImg } from "@/components/media/reveal-image";

export function AboutScrollScene({ hero, children }: { hero: ReactNode; children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: contentRef,
    offset: ["start end", "end end"],
  });
  const shadeOpacity = useTransform(scrollYProgress, [0, 0.35, 1], [0, 0.22, 0.55]);
  const fadeOpacity = useTransform(scrollYProgress, [0, 0.35, 1], [0.4, 0.65, 1]);

  return (
    <div className="about-scroll-scene relative isolate bg-paper">
      <div
        aria-hidden
        className="about-scene-backdrop sticky top-[-3rem] z-0 h-[calc(100svh+3rem)] overflow-hidden md:top-[-16rem] md:h-[calc(100svh+16rem)]"
      >
        <RevealImg
          src="/images/background.jpg" alt="" loading="eager"
          className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.9] saturate-[0.85]"
        />
        <motion.div className="about-scene-fade absolute inset-0" style={{ opacity: reducedMotion ? 1 : fadeOpacity }} />
        <motion.div
          className="about-scene-shade absolute inset-0 bg-paper"
          style={{ "--about-shade-opacity": reducedMotion ? 0 : shadeOpacity } as MotionStyle}
        />
      </div>
      <div className="about-scene-foreground relative z-10 -mt-[calc(100svh+3rem)] md:-mt-[calc(100svh+16rem)]">
        {hero}
        <div ref={contentRef} className="about-scene-content">{children}</div>
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
