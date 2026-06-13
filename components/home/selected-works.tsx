import Link from "next/link";
import { WorkCard } from "@/components/work-card";
import type { Work } from "@/lib/works";

type Props = {
  works: Work[];
};

const VARIANTS = ["tall", "wide", "tall"] as const;

export function SelectedWorks({ works }: Props) {
  if (works.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-32 md:px-10">
      <div className="border-b border-rule pb-10 text-center">
        <h1 className="font-sans text-[clamp(4.5rem,12vw,10rem)] font-light leading-tight">
          寂静无声
        </h1>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-3">
        {works.map((work, i) => (
          <WorkCard
            key={work.slug}
            work={work}
            index={i + 1}
            variant={VARIANTS[i % VARIANTS.length]}
          />
        ))}
      </div>
    </div>
  );
}
