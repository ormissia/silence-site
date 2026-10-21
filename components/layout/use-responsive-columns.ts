"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 按容器实际宽度计算栏数。
 *
 * 首帧（SSR 与 hydration 时）没有容器宽度，用视口宽度给一个合理值，
 * 避免桌面端先闪成窄屏栏数；挂载后立刻改为容器的真实宽度，
 * 这样内容有最大宽度时栏数依然跟着容器走。
 */
export function useResponsiveColumns<T extends HTMLElement>(
  resolve: (width: number) => number,
  viewportFallback = 1440,
) {
  const ref = useRef<T>(null);
  const [columns, setColumns] = useState(() => resolve(viewportFallback));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth;
      if (width > 0) setColumns(resolve(width));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
    // resolve 是纯函数，调用方每次渲染重建也无妨，这里只跟随挂载。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, columns };
}
