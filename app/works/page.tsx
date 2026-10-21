import { Suspense } from "react";
import { WorksGallery } from "@/components/work/works-gallery";
import { PagePlate } from "@/components/layout/page-plate";
import { CollectionLoading } from "@/components/layout/page-loading";
import { buildSrc } from "@/lib/oss";
import { listWorkSummaries, listWorksCategoryCounts } from "@/lib/works";

export const metadata = {
  title: "光的片段 · Works — SILENCE",
};

export default async function WorksPage() {
  const [works, categoryCounts] = await Promise.all([
    listWorkSummaries(),
    listWorksCategoryCounts(),
  ]);
  // 图版使用最新一组非胶片作品的封面；全是胶片时退回最新一组。
  const plateWork = works.find((work) => work.series !== "胶片") ?? works[0];

  return (
    <>
      <PagePlate
        label="Works"
        count={works.length}
        countLabel=" 组作品"
        title="光的片段"
        lede="风光、日常与胶片，按系列归档。每一组都是一次出门。"
        image={plateWork ? { src: buildSrc(plateWork.cover, "hero") } : undefined}
      />
      <section className="page-frame pb-20">
        <Suspense fallback={<CollectionLoading />}>
          <WorksGallery works={works} categoryCounts={categoryCounts} />
        </Suspense>
      </section>
    </>
  );
}
