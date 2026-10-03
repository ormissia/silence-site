"use client";

import { useId, useState } from "react";
import type { ReadingEntry } from "@/lib/reading";
import { readingCategoryStatistics } from "@/lib/reading-statistics";

const COLORS = ["#97816b", "#71877d", "#8c91a7", "#b69b6c", "#a88078", "#7b9aab", "#9a8aa4", "#929964", "#af8e69", "#687d92", "#9c707e", "#7c9994", "#a5a092"];

type SegmentInfo = { key: string; category: string; label: string; value: string; share: number };

/** Separate arc paths make each visible segment its own pointer target. */
function ringArc(radius: number, start: number, share: number) {
  const point = (percent: number) => {
    const angle = percent / 100 * Math.PI * 2;
    return `${(92 + radius * Math.cos(angle)).toFixed(4)} ${(92 + radius * Math.sin(angle)).toFixed(4)}`;
  };
  if (share === 100) {
    return `M ${point(start)} A ${radius} ${radius} 0 1 1 ${point(start + 50)} A ${radius} ${radius} 0 1 1 ${point(start + 100)}`;
  }
  return `M ${point(start)} A ${radius} ${radius} 0 ${share > 50 ? 1 : 0} 1 ${point(start + share)}`;
}

export function YearStatistics({ books, categories }: { books: ReadingEntry[]; categories: string[] }) {
  const [active, setActive] = useState<SegmentInfo | null>(null);
  const tooltipId = useId();
  const stats = readingCategoryStatistics(books);
  const colorMap = new Map([...categories].sort((a, b) => a.localeCompare(b, "zh-CN")).map((category, index) => [category, COLORS[index % COLORS.length]]));
  const rings = [
    { metric: "minutes" as const, total: stats.totalMinutes, radius: 76, label: "阅读时长" },
    { metric: "count" as const, total: stats.totalCount, radius: 53, label: "书籍数量" },
  ];

  return (
    <figure className="reading-year-statistics mx-auto mt-6 max-w-[184px]">
      <div className="relative">
        <svg viewBox="0 0 184 184" role="group" aria-label={`分类统计：${stats.totalCount} 本书，累计阅读 ${(stats.totalMinutes / 60).toFixed(1)} 小时；外圈时长，内圈数量。`} className="mx-auto block w-full max-w-[184px]">
          {rings.map(({ metric, total, radius, label }) => {
            let offset = 0;
            return (
              <g key={metric} transform="rotate(-90 92 92)">
                <circle cx="92" cy="92" r={radius} fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="16" />
                {total > 0 && stats.categories.map((entry) => {
                  const share = entry[metric] / total * 100;
                  const start = offset;
                  offset += share;
                  if (!share) return null;
                  const info = {
                    key: `${metric}-${entry.category}`,
                    category: entry.category,
                    label,
                    value: metric === "minutes" ? `${Math.floor(entry.minutes / 60)} 小时 ${entry.minutes % 60} 分钟` : `${entry.count} 本`,
                    share,
                  };
                  return (
                    <path key={entry.category} d={ringArc(radius, start, share)} fill="none" stroke={colorMap.get(entry.category)} strokeWidth={active?.key === info.key ? 24 : 16} pointerEvents="stroke"
                      tabIndex={0} aria-label={`${entry.category} · ${label}：${info.value}，占比 ${share.toFixed(1)}%`}
                      aria-describedby={active?.key === info.key ? tooltipId : undefined}
                      onPointerEnter={() => setActive(info)} onPointerLeave={() => setActive(null)}
                      onFocus={() => setActive(info)} onBlur={() => setActive(null)}
                      onKeyDown={(event) => { if (event.key === "Escape") setActive(null); }}
                      className="cursor-default outline-none transition-[stroke-width] duration-150 ease-out motion-reduce:transition-none" />
                  );
                })}
              </g>
            );
          })}
          <text x="92" y="91" textAnchor="middle" fill="currentColor" fontSize="22" fontWeight="500">{(stats.totalMinutes / 60).toFixed(1)}h</text>
          <text x="92" y="110" textAnchor="middle" fill="currentColor" opacity=".6" fontSize="11">{stats.totalCount} 本</text>
        </svg>
        {active && (
          <div id={tooltipId} role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[200px] -translate-x-1/2 rounded-lg border border-ink/15 bg-surface-raised px-3 py-2 text-left text-[11px] leading-relaxed tracking-normal text-ink shadow-lg">
            <p className="font-medium">{active.category}</p>
            <p className="mt-1 text-muted">{active.label} · {active.value}</p>
            <p className="text-muted">占比 {active.share.toFixed(1)}%</p>
          </div>
        )}
      </div>
      <figcaption className="mt-3 text-center text-[10px] tracking-normal text-muted">外圈 · 阅读时长　内圈 · 书籍数量</figcaption>
      <dl className="mt-4 space-y-2 text-left text-[10px] leading-relaxed tracking-normal">
        {stats.categories.map((entry) => (
          <div key={entry.category} className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <dt className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: colorMap.get(entry.category) }} />{entry.category}</dt>
            <dd className="text-muted" title={`${entry.count} 本 · ${Math.floor(entry.minutes / 60)} 小时 ${entry.minutes % 60} 分钟`}>{entry.count} 本 · {(entry.minutes / 60).toFixed(1)}h</dd>
          </div>
        ))}
      </dl>
      {stats.missingTime > 0 && <p className="mt-3 text-[10px] leading-relaxed tracking-normal text-muted">{stats.missingTime} 本未记录时长，仅计入数量。</p>}
    </figure>
  );
}
