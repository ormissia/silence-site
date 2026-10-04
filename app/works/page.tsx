import { Suspense } from "react";
import { WorksGallery } from "@/components/work/works-gallery";
import { SecondaryPageHeader } from "@/components/layout/secondary-page-header";
import { CollectionLoading } from "@/components/layout/page-loading";
import { listWorkSummaries, listWorksCategoryCounts } from "@/lib/works";

export const metadata = {
  title: "Works — SILENCE",
};

export default async function WorksPage() {
  const [works, categoryCounts] = await Promise.all([
    listWorkSummaries(),
    listWorksCategoryCounts(),
  ]);

  return (
    <section className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:px-12 md:pt-44">
      <SecondaryPageHeader
        count={`${works.length} Works`}
        eyebrow="Index of Works — 2024 / Ongoing"
        titleEn="WORKS"
        titleZh="作品"
        lede="风光、人像、与日常之间的随手——按主题分门别类地翻看。"
      />

      <Suspense fallback={<CollectionLoading />}>
        <WorksGallery works={works} categoryCounts={categoryCounts} />
      </Suspense>
    </section>
  );
}
