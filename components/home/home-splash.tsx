"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * 首页 splash：等首屏关键本地大图加载完 + 至少 1.5s 后再淡出。
 *
 * - 只挂在 / 路由（由 app/page.tsx 引入），其它路由不渲染
 * - 监听 background.jpg / cover.jpg 的 onload；onerror 也算"完成"，避免 404 把 splash 卡死
 * - 同时跑一个 1.5s 的最短时长兜底，避免快网下 splash 一闪而过
 * - 进度条 = min(图片完成比例, 时长完成比例)，给慢网用户明确反馈
 */

const CRITICAL_IMAGES = ["/images/background.jpg", "/images/cover.jpg"] as const;
const MIN_DURATION_MS = 1500;

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const finish = () => resolve();
    img.onload = () => {
      // decode() 让大图解码完成再算"完成"，避免淡出时再卡一下；不支持就降级到 onload
      if (typeof img.decode === "function") {
        img.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };
    img.onerror = finish;
    img.src = src;
  });
}

export function HomeSplash() {
  const [visible, setVisible] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [timeProgress, setTimeProgress] = useState(0);

  // 用 ref 避开 effect 依赖循环：进度变化驱动 visible，不需要让 effect 重跑
  const imagesLoadedRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    // 1) 图片预加载：每完成一张就推进图片进度
    CRITICAL_IMAGES.forEach((src) => {
      preloadImage(src).then(() => {
        if (cancelled) return;
        imagesLoadedRef.current += 1;
        setImagesLoaded(imagesLoadedRef.current);
      });
    });

    // 2) 最短时长：rAF 平滑驱动 timeProgress 0 → 1
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      if (cancelled) return;
      const p = Math.min(1, (now - start) / MIN_DURATION_MS);
      setTimeProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  // 同时满足"图片全加载完"和"最短时长到"才放行
  const imageProgress = imagesLoaded / CRITICAL_IMAGES.length;
  const progress = Math.min(imageProgress, timeProgress);

  useEffect(() => {
    if (progress >= 1) {
      setVisible(false);
    }
  }, [progress]);

  // 锁滚：splash 期间禁止 body 滚动，避免用户滚到下面看到半成品
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const percent = Math.round(progress * 100);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-paper"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}
          // 淡出阶段不挡按钮
          style={{ pointerEvents: visible ? "auto" : "none" }}
        >
          <div className="vignette pointer-events-none absolute inset-0" />

          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            <p className="eyebrow text-muted">Now Loading</p>
            <h1 className="mt-6 font-hairline text-display font-thin leading-[0.95] tracking-[0.4em]">
              SILENCE
            </h1>
            <p className="mt-6 max-w-column font-sans text-body leading-relaxed text-ink/60">
              寂静无声 · 正在装载光与文字
            </p>

            <div className="mt-16 flex flex-col items-center gap-3">
              <div className="relative h-px w-[280px] overflow-hidden bg-ink/15">
                <motion.div
                  className="absolute inset-y-0 left-0 origin-left bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]"
                  style={{ width: "100%", scaleX: progress }}
                />
              </div>
              <span className="font-sans text-label uppercase tracking-[0.32em] tabular-nums text-ink/70">
                {String(percent).padStart(3, "0")}%
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
