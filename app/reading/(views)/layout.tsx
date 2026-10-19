import type { ReactNode } from "react";
import { listReadingSummaries } from "@/lib/reading";
import { SecondaryPageHeader } from "@/components/layout/secondary-page-header";
import { ReadingViewContent } from "@/components/reading/reading-view-content";

export default function ReadingViewsLayout({ children }: { children: ReactNode }) {
  return (
    <section className="collection-page mx-auto max-w-[1400px] px-6 pb-20 md:px-12">
      <SecondaryPageHeader
        count={`${listReadingSummaries().length} Books`}
        eyebrow="Reading — Notes from Books"
        titleEn="READING"
        titleZh="读书笔记"
        lede="一本本读过的书，划过的句子，留给以后的自己。"
      />
      <div className="mt-4 md:mt-10">
        <ReadingViewContent>{children}</ReadingViewContent>
      </div>
    </section>
  );
}
