"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { WorkCard } from "@/components/work-card";
import { tabToSeries, seriesToTab } from "@/lib/categories";
import { CategoryTabs, type CategoryTab } from "@/components/layout/category-tabs";
import type { Work } from "@/lib/works";
import { RestoreListScroll } from "@/components/layout/list-return";

type Props = {
  works: Work[];
  /** 各 series 的作品数，由 server 在 page.tsx 计算后传入 */
  categoryCounts: Array<{ series: string; count: number }>;
};

export function WorksGallery({ works, categoryCounts }: Props) {
  const params = useSearchParams();
  const activeTab = params.get("tab") ?? "all";
  const activeSeries = tabToSeries(activeTab);

  const filtered = useMemo(
    () => (activeSeries ? works.filter((w) => w.series === activeSeries) : works),
    [works, activeSeries]
  );

  // 把 series 计数翻译成 tab slug 计数；"全部" tab 单独拼上
  const tabs: CategoryTab[] = useMemo(() => {
    const result: CategoryTab[] = [
      { slug: "all", label: "全部", count: works.length },
    ];
    for (const { series, count } of categoryCounts) {
      result.push({ slug: seriesToTab(series), label: series, count });
    }
    return result;
  }, [works.length, categoryCounts]);

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

      <div className="relative pb-16">
        {activeTab === "film" && <div aria-hidden className="pointer-events-none absolute -inset-x-6 inset-y-0 bg-cover bg-center opacity-50 md:-inset-x-12" style={{ backgroundImage: 'url("/images/film/film-scratch.jpg")' }} />}
        {filtered.length === 0 ? (
          <p className="relative py-24 text-center text-muted">这个分类下还没有作品。</p>
        ) : (
          <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2">
            {filtered.map((work, index) => <WorkCard key={work.slug} work={work} index={index} tab={activeTab} />)}
          </div>
        )}
      </div>
    </>
  );
}
