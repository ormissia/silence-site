"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * 单个 tab 的数据：slug 是 URL 值（与 basePath 拼成 ?paramName=slug），
 * label 是显示文本，count 可选——给出就显示一个小徽标，跟 reading 现有风格一致。
 */
export type CategoryTab = {
  slug: string;
  label: string;
  count?: number;
};

/**
 * 二级页（works / journal / reading）共享的分类切换条。
 *
 * 视觉源自 reading-shelf 的 CategoryTab：
 *   - tab 文字 + 小数字徽标
 *   - hover / active 用底部 2px 下划线动画
 *   - 右上角放一段总数文本（"10 Works"），由调用方拼好传入
 *
 * 行为：
 *   - 默认 slug（一般是 "all"）选中时，URL 不带 query → 干净的 /works
 *   - 切换其他 tab → router.replace 加 ?{paramName}={slug}，scroll: false 不滚顶
 */
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

  const onClick = (slug: string) => {
    const next =
      slug === defaultSlug
        ? basePath
        : `${basePath}?${paramName}=${encodeURIComponent(slug)}`;
    router.replace(next, { scroll: false });
  };

  return (
    <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-rule/60 pb-4">
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
        <span className="ml-auto font-sans text-xs uppercase tracking-[0.24em] text-muted">
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
      className={`group relative inline-flex items-center gap-2 py-2 font-sans text-sm uppercase tracking-[0.18em] transition-colors duration-200 ${
        isActive ? "text-ink" : "text-muted hover:text-ink"
      }`}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={`font-sans text-[10px] tracking-[0.12em] ${
            isActive ? "text-accent" : "text-muted/70"
          }`}
        >
          {count}
        </span>
      )}
      <span
        className={`absolute -bottom-0.5 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-ink transition-[width] duration-300 ease-out ${
          isActive ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </button>
  );
}
