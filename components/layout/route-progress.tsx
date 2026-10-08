"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouteProgress } from "./route-progress-state";

export { RouteProgressProvider, useRouteProgress } from "./route-progress-state";

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


/**
 * 进度条本体。挂在 layout 顶部，固定 viewport。
 * 监听 pathname + search 变化——变化即视为"路由切换完毕"，触发收尾。
 */
export function RouteProgress() {
  const reducedMotion = useReducedMotion();
  const ctx = useRouteProgress();
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
      ctx.done();
    }
  }, [pathname, search, ctx]);


  return (
    <AnimatePresence>
      {ctx.isLoading && (
        <motion.div
          aria-hidden
          className="route-progress-line pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left"
          initial={{ scaleX: reducedMotion ? 0.8 : 0, opacity: 1 }}
          // 0 → 80%：~600ms 缓动；卡在 80% 等路由切换；切完后由 exit 动画到 100% 再淡出
          animate={{ scaleX: 0.8 }}
          transition={{ duration: reducedMotion ? 0 : 0.65, ease: [0.2, 0.7, 0.2, 1] }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: reducedMotion ? 0 : 0.4, ease: [0.2, 0.7, 0.2, 1] } }}
        />
      )}
    </AnimatePresence>
  );
}
