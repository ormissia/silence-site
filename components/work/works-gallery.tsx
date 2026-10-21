"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { WorkCard } from "@/components/work-card";
import { tabToSeries, seriesToTab } from "@/lib/categories";
import { CategoryTabs, type CategoryTab } from "@/components/layout/category-tabs";
import { Waterfall } from "@/components/layout/waterfall";
import { useResponsiveColumns } from "@/components/layout/use-responsive-columns";
import type { WorkSummary } from "@/lib/works/types";
import { RestoreListScroll } from "@/components/layout/list-return";
import styles from "./works-index.module.css";

type Props = {
  works: WorkSummary[];
  /** 各 series 的作品数，由 server 在 page.tsx 计算后传入 */
  categoryCounts: Array<{ series: string; count: number }>;
};

/** 窄屏 1 栏，常规 2 栏，宽屏 3 栏；按容器宽度计算。 */
const resolveColumns = (width: number) => (width >= 1180 ? 3 : width >= 560 ? 2 : 1);

/** 按年份分组；组内保持 listWorks 的时间倒序。 */
function groupByYear(works: WorkSummary[]) {
  const groups = new Map<string, WorkSummary[]>();
  for (const work of works) {
    const year = work.date.slice(0, 4);
    const list = groups.get(year) ?? [];
    list.push(work);
    groups.set(year, list);
  }
  return Array.from(groups, ([year, items]) => ({ year, items }))
    .sort((a, b) => b.year.localeCompare(a.year));
}

export function WorksGallery({ works, categoryCounts }: Props) {
  const params = useSearchParams();
  const activeTab = params.get("tab") ?? "all";
  const activeSeries = tabToSeries(activeTab);
  const { ref, columns } = useResponsiveColumns<HTMLDivElement>(resolveColumns);

  // 只按时间倒序，再按年分段；不做系列分组。
  const filtered = useMemo(
    () => (activeSeries ? works.filter((w) => w.series === activeSeries) : works),
    [works, activeSeries]
  );
  const groups = useMemo(() => groupByYear(filtered), [filtered]);

  const tabs: CategoryTab[] = useMemo(() => [
    { slug: "all", label: "全部", count: works.length },
    ...categoryCounts.map(({ series, count }) => ({ slug: seriesToTab(series), label: series, count })),
  ], [works.length, categoryCounts]);

  const totalLabel = `${filtered.length} ${filtered.length > 1 ? "Works" : "Work"}`;

  return (
    <>
      <RestoreListScroll />
      <CategoryTabs
        tabs={tabs}
        paramName="tab"
        basePath="/works"
        totalLabel={totalLabel}
      />

      <div ref={ref} className="pt-8 md:pt-10">
        {groups.length === 0 ? (
          <p className="py-24 text-muted">这个分类下还没有作品。</p>
        ) : groups.map(({ year, items }) => (
          <section key={year} className={styles.yearSection} aria-labelledby={`works-year-${year}`}>
            <header className={styles.yearHead}>
              <h2 id={`works-year-${year}`} className={styles.yearTitle}>{year}</h2>
              <p className={styles.yearCount}>
                {items.length}<span className="sr-only"> 组</span>
              </p>
            </header>
            <Waterfall
              items={items.map(work => ({
                key: work.slug,
                node: <WorkCard work={work} tab={activeTab} density={work.series === "胶片" ? "sheet" : "grid"} />,
              }))}
              columns={columns}
              gap={columns === 1 ? 24 : 32}
            />
          </section>
        ))}
      </div>
    </>
  );
}
