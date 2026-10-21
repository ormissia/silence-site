"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Item = { key: string; node: ReactNode };

/**
 * 瀑布流分栏，按「行优先」保持横向阅读顺序。
 *
 * CSS 多列是从上往下填满一栏再换栏，读起来是纵向顺序。这里自己分配：
 * 依次把每张卡片放进当前最矮的一栏，因此同一行的卡片仍按内容顺序从左到右，
 * 观感是瀑布流，阅读顺序是横向的。
 *
 * 高度来自真实 DOM 测量；尚未测量的卡片按"平均高度"估计，
 * 避免首屏全部堆进第一栏。
 */
export function Waterfall({ items, columns, gap = 28, className = "", itemClassName = "" }: {
  items: Item[];
  columns: number;
  gap?: number;
  className?: string;
  itemClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heights = useRef(new Map<string, number>());
  const [version, setVersion] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let changed = false;
        container.querySelectorAll<HTMLElement>("[data-waterfall-key]").forEach((element) => {
          const key = element.dataset.waterfallKey;
          if (!key) return;
          const height = element.offsetHeight + gap;
          if (Math.abs((heights.current.get(key) ?? -1) - height) > 1) {
            heights.current.set(key, height);
            changed = true;
          }
        });
        if (changed) setVersion(value => value + 1);
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    container.querySelectorAll<HTMLElement>("[data-waterfall-key]").forEach((element) => observer.observe(element));
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [items, columns, gap]);

  const buckets = useMemo(() => {
    const known = Array.from(heights.current.values());
    const estimate = known.length ? known.reduce((sum, value) => sum + value, 0) / known.length : 1;
    const columnHeight = new Array(columns).fill(0);
    const result: Item[][] = Array.from({ length: columns }, () => []);
    for (const item of items) {
      const target = columnHeight.indexOf(Math.min(...columnHeight));
      result[target].push(item);
      columnHeight[target] += heights.current.get(item.key) ?? estimate;
    }
    return result;
    // version 用于测量后重排。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, columns, version]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, columnGap: gap, alignItems: "start" }}
    >
      {buckets.map((bucket, index) => (
        <div key={index} style={{ display: "grid", rowGap: gap, minWidth: 0 }}>
          {bucket.map(item => (
            <div key={item.key} data-waterfall-key={item.key} className={itemClassName}>{item.node}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
