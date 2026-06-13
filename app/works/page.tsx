import { Suspense } from "react";
import { WorksGallery } from "@/components/work/works-gallery";
import { listWorks } from "@/lib/works";

export const metadata = {
  title: "Works — SILENCE",
};

export default async function WorksPage() {
  const works = await listWorks();

  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 md:px-10 md:pt-40">
      <header className="border-b border-rule pb-10">
        <p className="eyebrow">Index of Works — 2024 / Ongoing</p>
        <h1 className="mt-3 font-sans text-display">
          WORKS <span className="text-muted">/</span>{" "}
          <span className="italic">作品</span>
        </h1>
        <p className="mt-6 max-w-column font-sans text-lede text-ink/80">
          风光、人像、与日常之间的随手——按主题分门别类地翻看。
        </p>
      </header>

      <Suspense
        fallback={
          <div className="mt-12 h-[60vh] border-b border-rule/60" aria-hidden />
        }
      >
        <WorksGallery works={works} />
      </Suspense>
    </section>
  );
}
