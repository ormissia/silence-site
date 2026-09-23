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

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setVisible(false);
    }, MAX_WAIT_MS);

    Promise.all(CRITICAL_IMAGES.map(preloadImage)).then(() => {
      if (cancelled) return;
      window.clearTimeout(timeout);
      setVisible(false);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  // 锁滚：splash 期间禁止 body 滚动，避免用户滚到下面看到半成品
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

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
            <p className="home-splash-wordmark mt-6 font-sans text-display font-light leading-tight tracking-[0.12em]">
              SILENCE
            </p>
            <p className="mt-6 max-w-column font-sans text-body leading-relaxed text-ink/60">
              寂静无声 · 正在装载光与文字
            </p>

            <div className="home-splash-track relative mt-16 h-px w-[280px] overflow-hidden bg-ink/15" aria-hidden>
              <span className="home-splash-line absolute inset-y-0 left-0 w-2/5 bg-gradient-accent" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
