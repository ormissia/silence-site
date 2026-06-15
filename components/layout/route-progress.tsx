"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/**
 * 顶部 2px 路由进度条 + Provider。
 *
 * 解决"网慢的时候点链接没反应"——`<Link>` 默认要等下一页 RSC 数据回来才换屏，
 * 中间有几百 ms 视觉空窗。这个组件给两类反馈：
 *   - click 立刻：`useRouteProgress().start()` 让条子瞬间冒出，爬到 ~80%
 *   - 路由真切完：监听 pathname/search 变化，冲到 100% 再淡出
 *
 * 使用约定：
 *   - layout.tsx 用 <RouteProgressProvider> 包整个 app
 *   - 进度条本体 <RouteProgress /> 也挂在 layout 内，固定顶部
 *   - 任何 client 组件可以 useRouteProgress().start() 在 click handler 立即触发
 */

type Ctx = {
  /** 立刻把条子拉起来（click 时调） */
  start: () => void;
  /** 立刻收尾（少用；通常由路由变化自动触发） */
  done: () => void;
  /** 当前是否在加载状态——provider 内部用 */
  isLoading: boolean;
};

const RouteProgressCtx = createContext<Ctx | null>(null);

export function useRouteProgress(): Ctx {
  const ctx = useContext(RouteProgressCtx);
  // 没在 Provider 下时返回一个空操作，避免 Provider 没挂时崩
  if (!ctx) return { start: () => {}, done: () => {}, isLoading: false };
  return ctx;
}

export function RouteProgressProvider({ children }: { children: ReactNode }) {
  const [isLoading, setLoading] = useState(false);

  const start = useCallback(() => setLoading(true), []);
  const done = useCallback(() => setLoading(false), []);

  return (
    <RouteProgressCtx.Provider value={{ start, done, isLoading }}>
      {children}
    </RouteProgressCtx.Provider>
  );
}

/**
 * 进度条本体。挂在 layout 顶部，固定 viewport。
 * 监听 pathname + search 变化——变化即视为"路由切换完毕"，触发收尾。
 */
export function RouteProgress() {
  const ctx = useContext(RouteProgressCtx);
  const pathname = usePathname();
  const search = useSearchParams();
  // 第一次挂载时记下当前 key，之后变化才视为路由切换
  const initialKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${pathname}?${search?.toString() ?? ""}`;
    if (initialKey.current === null) {
      initialKey.current = key;
      return;
    }
    if (key !== initialKey.current) {
      initialKey.current = key;
      // 路由真换了 → 收尾
      ctx?.done();
    }
  }, [pathname, search, ctx]);

  if (!ctx) return null;

  return (
    <AnimatePresence>
      {ctx.isLoading && (
        <motion.div
          aria-hidden
          // amber-400 (#FBBF24) 醒目土黄；shadow 让暗背景下条子像发光
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]"
          initial={{ scaleX: 0, opacity: 1 }}
          // 0 → 80%：~600ms 缓动；卡在 80% 等路由切换；切完后由 exit 动画到 100% 再淡出
          animate={{ scaleX: 0.8 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.25, ease: "easeOut" } }}
        />
      )}
    </AnimatePresence>
  );
}
