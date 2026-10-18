"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionStyle } from "framer-motion";
import { RevealImg } from "@/components/media/reveal-image";
import { AboutIceReveal } from "./about-ice-reveal";

export function AboutScrollScene({
  hero,
  children,
  backgroundReserveRatio,
}: {
  hero: ReactNode;
  children: ReactNode;
  /** 首段诗完全显现后剩余的背景行程比例，范围 0–1。 */
  backgroundReserveRatio: number;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const reserveRatio = Math.min(1, Math.max(0, backgroundReserveRatio));
  const { scrollYProgress: introProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end 0.6"],
  });
  const { scrollYProgress: readingProgress } = useScroll({
    target: contentRef,
    offset: ["start 0.6", "end end"],
  });
  const { scrollYProgress } = useScroll({
    target: contentRef,
    offset: ["start end", "end end"],
  });
  const shadeOpacity = useTransform(scrollYProgress, [0, 0.35, 1], [0, 0.22, 0.55]);
  const fadeOpacity = useTransform(scrollYProgress, [0, 0.35, 1], [0.4, 0.65, 1]);
  const backgroundY = useTransform(() => {
    const progress = introProgress.get() * (1 - reserveRatio) + readingProgress.get() * reserveRatio;
    return `calc(var(--about-background-travel) * ${-progress})`;
  });

  return (
    <div ref={sceneRef} className="about-scroll-scene relative isolate bg-paper [--about-background-travel:3rem] md:[--about-background-travel:16rem]">
      <div
        aria-hidden
        className="about-scene-backdrop sticky top-0 z-0 h-svh overflow-hidden motion-reduce:top-[calc(-1*var(--about-background-travel))] motion-reduce:h-[calc(100svh+var(--about-background-travel))]"
      >
        <motion.div
          className="about-scene-image absolute inset-x-0 top-0 h-[calc(100svh+var(--about-background-travel))] motion-reduce:!transform-none"
          style={{ y: reducedMotion ? 0 : backgroundY }}
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
          <AboutIceReveal interactionRef={sceneRef} fadeOpacity={fadeOpacity} shadeOpacity={shadeOpacity} />
        </motion.div>
      </div>
      <div className="about-scene-foreground relative z-10 -mt-[100svh] motion-reduce:-mt-[calc(100svh+var(--about-background-travel))]">
        <div ref={heroRef} className="relative">{hero}</div>
        <div ref={contentRef} className="about-scene-content relative">{children}</div>
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
