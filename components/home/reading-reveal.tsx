"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";

/** 默认可见，进入视口时只播放一次；键盘聚焦时立即显示。 */
export function ReadingReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !("IntersectionObserver" in window)) {
      controls.set({ opacity: 1, y: 0 });
      return;
    }
    // 页面恢复滚动位置时，已经可见的内容不重新隐藏。
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    controls.set({ opacity: 0, y: 16 });
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      void controls.start({ opacity: 1, y: 0 });
      observer.disconnect();
    }, { threshold: 0.08 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [controls, reduced]);

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={controls}
      transition={{ duration: reduced ? 0 : 0.9, ease: "easeOut" }}
      onFocusCapture={() => controls.set({ opacity: 1, y: 0 })}
      className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8"
    >
      {children}
    </motion.div>
  );
}
