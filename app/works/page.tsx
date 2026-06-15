import { Suspense } from "react";
import { WorksGallery } from "@/components/work/works-gallery";
import { SecondaryPageHeader } from "@/components/layout/secondary-page-header";
import { listWorks, listWorksCategoryCounts } from "@/lib/works";

export const metadata = {
  title: "Works — SILENCE",
};

export default async function WorksPage() {
  const [works, categoryCounts] = await Promise.all([
    listWorks(),
    listWorksCategoryCounts(),
  ]);

  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 md:px-10 md:pt-40">
      <SecondaryPageHeader
        eyebrow="Index of Works — 2024 / Ongoing"
        titleEn="WORKS"
        titleZh="作品"
        lede="风光、人像、与日常之间的随手——按主题分门别类地翻看。"
      />

      <Suspense
        fallback={
          <div className="mt-12 h-[60vh] border-b border-rule/60" aria-hidden />
        }
      >
        <WorksGallery works={works} categoryCounts={categoryCounts} />
      </Suspense>
    </section>
  );
}
