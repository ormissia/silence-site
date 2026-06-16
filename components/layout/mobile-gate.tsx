"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 768px)";

/**
 * 首页专属移动端遮罩：仅当 pathname === "/" 且视口 ≤ 768px 时显示。
 * 直白告知"不想做移动端适配"，提供"我开心"按钮临时绕过。
 *
 * 绕过状态只存在组件 state——刷新或重新进入首页时都会再次拦截，
 * 但路由跳走（如点 Works）不会再次出现，因为 pathname 已经不是 "/"。
 *
 * 放在 layout 里 fixed 全屏覆盖；SSR 安全：服务端不渲染遮罩，
 * 客户端 mount 后才根据 matchMedia + pathname 决定显示。
 */
export function MobileGate() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [bypassed, setBypassed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    setReady(true);

    return () => mq.removeEventListener("change", update);
  }, []);

  const onBypass = () => setBypassed(true);

  if (!ready || !isMobile || bypassed || pathname !== "/") return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-paper px-6 text-center">
      <div className="vignette pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center">
        <p className="eyebrow">Desktop Only</p>
        <h1 className="mt-6 font-hairline text-[clamp(2.75rem,12vw,5rem)] font-thin leading-[1.05] tracking-[0.04em]">
          不想做
          <br />
          移动端
          <br />
          适配
        </h1>
        <p className="mt-10 max-w-[20rem] font-sans text-sm leading-relaxed text-ink/70">
          请用电脑浏览这个站点，画面与排版只在大屏上能立得住。
        </p>
        <button
          type="button"
          onClick={onBypass}
          className="mt-12 inline-flex items-center gap-3 border border-ink/30 bg-ink/5 px-6 py-3 font-sans text-xs uppercase tracking-[0.24em] backdrop-blur-sm transition active:scale-95 active:opacity-80"
        >
          我开心 <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
