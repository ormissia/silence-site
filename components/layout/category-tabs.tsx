"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 单个 tab 的数据：slug 是 URL 值（与 basePath 拼成 ?paramName=slug），
 * label 是显示文本，count 可选——给出就显示一个小徽标，跟 reading 现有风格一致。
 */
export type CategoryTab = {
  slug: string;
  label: string;
  count?: number;
};

/** 共享胶囊分类条；选中状态与 URL 查询参数保持同步。 */
export function CategoryTabs({
  tabs,
  paramName,
  basePath,
  defaultSlug = "all",
  totalLabel,
}: {
  tabs: CategoryTab[];
  /** URL query 参数名，works 用 "tab"，journal/reading 用 "cat" */
  paramName: string;
  /** 路由前缀，如 "/works" "/journal" "/reading" */
  basePath: string;
  /** 哪个 slug 视为"无 query 参数"的默认状态，默认 "all" */
  defaultSlug?: string;
  /** 右上角总数文本，如 "10 Works" "5 Notes"。不传则不显示 */
  totalLabel?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get(paramName) ?? defaultSlug;
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    const selected = row?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (!row || !selected || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: selected.offsetLeft - row.offsetLeft - (row.clientWidth - selected.clientWidth) / 2 });
  }, [active]);

  const onClick = (slug: string) => {
    const next =
      slug === defaultSlug
        ? basePath
        : `${basePath}?${paramName}=${encodeURIComponent(slug)}`;
    router.replace(next, { scroll: false });
  };

  return (
    <div ref={rowRef} role="group" aria-label="分类筛选" className="category-tabs my-4 flex items-center gap-2 overflow-x-auto pb-2 md:my-6 md:flex-wrap md:overflow-visible md:pb-0">
      {tabs.map((t) => (
        <TabButton
          key={t.slug}
          label={t.label}
          count={t.count}
          isActive={t.slug === active}
          onClick={() => onClick(t.slug)}
        />
      ))}
      {totalLabel && (
        <span className="ml-auto hidden font-sans text-label uppercase tracking-[0.24em] text-muted md:block">
          {totalLabel}
        </span>
      )}
    </div>
  );
}

function TabButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`silence-pill shrink-0 font-sans uppercase ${isActive ? "text-ink" : "text-muted"}`}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={`font-sans text-annotation tracking-[0.12em] ${
            isActive ? "text-accent" : "text-muted/70"
          }`}
        >
          {count}
        </span>
      )}

    </button>
  );
}
