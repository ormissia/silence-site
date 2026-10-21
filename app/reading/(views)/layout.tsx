import type { ReactNode } from "react";
import { listReadingSummaries } from "@/lib/reading";
import { CoverMosaic, PagePlate } from "@/components/layout/page-plate";
import { ReadingViewContent } from "@/components/reading/reading-view-content";

const MOSAIC_SIZE = 48;

export default function ReadingViewsLayout({ children }: { children: ReactNode }) {
  const books = listReadingSummaries();
  // 最近读完的真实书封；不随机，构建结果稳定。
  const covers = books
    .filter((book) => book.cover)
    .sort((a, b) => (b.finishedDate ?? "").localeCompare(a.finishedDate ?? ""))
    .slice(0, MOSAIC_SIZE)
    .map((book) => book.cover!);

  return (
    <>
      <PagePlate
        label="Reading"
        count={books.length}
        countLabel=" 本书"
        title="字里行间"
        lede="一本本读过的书，划过的句子，留给以后的自己。"
      >
        <CoverMosaic covers={covers} />
      </PagePlate>
      <section className="page-frame pb-20">
        <ReadingViewContent>{children}</ReadingViewContent>
      </section>
    </>
  );
}
