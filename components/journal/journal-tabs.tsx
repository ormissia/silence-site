"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  JOURNAL_CATEGORIES,
  JOURNAL_CATEGORY_LABELS,
  type JournalCategory,
} from "@/lib/journal-categories";

const TABS: Array<{ value: "all" | JournalCategory; label: string }> = [
  { value: "all", label: "全部" },
  ...JOURNAL_CATEGORIES.map((c) => ({
    value: c,
    label: JOURNAL_CATEGORY_LABELS[c].zh,
  })),
];

export function JournalTabs({ counts }: { counts: Record<"all" | JournalCategory, number> }) {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("cat") ?? "all";

  const onClick = (val: string) => {
    const next = val === "all" ? "/journal" : `/journal?cat=${val}`;
    router.replace(next, { scroll: false });
  };

  return (
    <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-rule/60 pb-4">
      {TABS.map(({ value, label }) => {
        const isActive = value === active;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onClick(value)}
            className={`group relative inline-block py-2 font-sans text-sm uppercase tracking-[0.24em] transition-colors duration-200 ${
              isActive ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            <span>{label}</span>
            <span
              className={`absolute -bottom-0.5 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-ink transition-[width] duration-300 ease-out ${
                isActive ? "w-full" : "w-0 group-hover:w-full"
              }`}
            />
          </button>
        );
      })}
      <span className="ml-auto font-sans text-xs uppercase tracking-[0.24em] text-muted">
        {counts[active as "all" | JournalCategory] ?? 0} Notes
      </span>
    </div>
  );
}
