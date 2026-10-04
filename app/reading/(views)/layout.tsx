import type { ReactNode } from "react";
import { listReading } from "@/lib/reading";
import { SecondaryPageHeader } from "@/components/layout/secondary-page-header";
import { ReadingViewContent } from "@/components/reading/reading-view-content";

export default function ReadingViewsLayout({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pb-20 pt-[calc(var(--site-header-height)+1.5rem)] md:px-12 md:pt-44">
      <SecondaryPageHeader
        count={`${listReading().length} Books`}
        eyebrow="Reading — Notes from Books"
        titleEn="READING"
        titleZh="读书笔记"
        lede="一本本读过的书，划过的句子，留给以后的自己。"
      />
      <div className="mt-7 md:mt-10">
        <ReadingViewContent>{children}</ReadingViewContent>
      </div>
    </section>
  );
}
