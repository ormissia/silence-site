"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * 列表封面的视差与悬停放大。
 * 画框裁切、图片上下各多出一截；滚动时图片在框内缓慢位移，
 * 悬停时整体轻微放大。两者都在这一层合成，不会互相覆盖。
 */
export function CoverParallaxTile({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-x-0 -top-[10%] h-[120%]"
        style={reduced ? undefined : { y }}
        whileHover={reduced ? undefined : { scale: 1.035 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
