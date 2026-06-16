/**
 * 站点内置分类的纯常量定义。
 * 拆出本文件以避免 client component（site-header / works-gallery）
 * 通过 lib/works 间接引入 node:fs 而打包失败。
 */

export const CATEGORIES = ["风光", "人像", "日常", "胶片"] as const;
export type Category = (typeof CATEGORIES)[number];

/** URL 友好的英文 slug ↔ 中文 series 的双向映射 */
export const TAB_SLUGS = {
  landscape: "风光",
  portrait: "人像",
  snapshots: "日常",
  film: "胶片",
} as const satisfies Record<string, Category>;

export type TabSlug = keyof typeof TAB_SLUGS | "all";

export function tabToSeries(tab: string | null | undefined): Category | null {
  if (!tab || tab === "all") return null;
  return (TAB_SLUGS as Record<string, Category>)[tab] ?? null;
}

export function seriesToTab(series: string): TabSlug {
  const found = (Object.entries(TAB_SLUGS) as Array<[keyof typeof TAB_SLUGS, Category]>).find(
    ([, c]) => c === series
  );
  return found ? found[0] : "all";
}
