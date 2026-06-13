"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { WorkCard } from "@/components/work-card";
import { CATEGORIES, TAB_SLUGS, tabToSeries } from "@/lib/categories";
import type { Work } from "@/lib/works";

const VARIANTS = ["wide", "tall", "tall", "square", "tall", "wide"] as const;

const TABS: Array<{ slug: string; label: string }> = [
  { slug: "all", label: "全部" },
  ...CATEGORIES.map((cat) => {
    const slug = (Object.entries(TAB_SLUGS).find(([, c]) => c === cat) ?? ["all"])[0];
    return { slug, label: cat };
  }),
];

type Props = {
  works: Work[];
};

export function WorksGallery({ works }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const activeTab = params.get("tab") ?? "all";
  const activeSeries = tabToSeries(activeTab);

  const filtered = useMemo(
    () => (activeSeries ? works.filter((w) => w.series === activeSeries) : works),
    [works, activeSeries]
  );

  const handleTabClick = (slug: string) => {
    const next = slug === "all" ? "/works" : `/works?tab=${slug}`;
    router.replace(next, { scroll: false });
  };

  return (
    <>
      {/* Tabs */}
      <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-rule/60 pb-4">
        {TABS.map(({ slug, label }) => {
          const active = slug === activeTab;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => handleTabClick(slug)}
              className={`group relative inline-block py-2 font-sans text-sm uppercase tracking-[0.24em] transition-colors duration-200 ${
                active ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              <span>{label}</span>
              <span
                className={`absolute -bottom-0.5 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-ink transition-[width] duration-300 ease-out ${
                  active ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </button>
          );
        })}
        <span className="ml-auto font-sans text-xs uppercase tracking-[0.24em] text-muted">
          {filtered.length} {filtered.length > 1 ? "Works" : "Work"}
        </span>
      </div>

      {/* Film 模式提示条：胶卷头/批次号信息 */}
      {activeTab === "film" && filtered.length > 0 && (
        <div className="mt-8 flex items-center gap-4 border-y-2 border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.28em] text-amber-200/80">
          <span>● Film Roll</span>
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">35mm Color Negative</span>
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">Develop C-41</span>
          <span className="ml-auto">{new Date().getFullYear()} / Batch No. {String(filtered.length).padStart(3, "0")}</span>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="mt-24 text-center font-sans text-muted">没人可拍。</p>
      ) : (
        <div
          className={`mt-16 grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-3 ${
            activeTab === "film" ? "film-strip" : ""
          }`}
        >
          {filtered.map((w, i) => (
            <WorkCard
              key={w.slug}
              work={w}
              index={i}
              variant={VARIANTS[i % VARIANTS.length]}
            />
          ))}
        </div>
      )}
    </>
  );
}
