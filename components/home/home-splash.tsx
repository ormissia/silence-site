"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { CAMERA } from "@/components/camera-spec";

// 仅等待首屏图片；慢网或解码挂起时最多等待 4 秒。
const CRITICAL_IMAGES = ["/images/background.jpg", CAMERA.src];
const MAX_WAIT_MS = 4000;

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

  useEffect(() => {
    let cancelled = false;
    let completed = 0;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setVisible(false);
    }, MAX_WAIT_MS);

    CRITICAL_IMAGES.forEach((src) => {
      preloadImage(src).then(() => {
        if (cancelled) return;
        completed += 1;
        setImagesLoaded(completed);
        if (completed === CRITICAL_IMAGES.length) {
          window.clearTimeout(timeout);
          setVisible(false);
        }
      });
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  const progress = imagesLoaded / CRITICAL_IMAGES.length;

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
          exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
          // 淡出阶段不挡按钮
          style={{ pointerEvents: "none" }}
        >
          <div className="vignette pointer-events-none absolute inset-0" />

          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            <p className="font-sans text-caption uppercase text-muted">Now Loading</p>
            <p className="mt-6 font-sans text-display font-light leading-tight tracking-[0.12em]">
              SILENCE
            </p>
            <p className="mt-6 max-w-column font-sans text-body leading-relaxed text-ink/60">
              寂静无声 · 正在装载光与文字
            </p>

            <div className="mt-16 flex flex-col items-center gap-3">
              <div className="relative h-px w-[280px] overflow-hidden bg-ink/15">
                <motion.div
                  className="absolute inset-y-0 left-0 origin-left bg-gradient-accent"
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
