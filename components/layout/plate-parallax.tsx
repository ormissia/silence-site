"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * 图版背景的视差：与封面详情首屏同一做法，但行程更大。
 * 图片比画框高出 32%，滚动穿过图版时在框内向下位移 30%，
 * 画框本身不动，只有画面在移动。
 */
export function PlateParallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-x-0 -top-[16%] h-[132%]"
        style={reduced ? undefined : { y }}
      >
        {children}
      </motion.div>
    </div>
  );
}
