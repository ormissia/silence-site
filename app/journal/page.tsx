import { Suspense } from "react";
import { listJournalSummaries } from "@/lib/journal";
import { buildSrc } from "@/lib/oss";
import { JournalList } from "@/components/journal/journal-list";
import { PagePlate } from "@/components/layout/page-plate";
import { CollectionLoading } from "@/components/layout/page-loading";

export const metadata = {
  title: "只言片语 · Journal — SILENCE",
};

export default function JournalPage() {
  const entries = listJournalSummaries();
  const plateEntry = entries.find((entry) => entry.cover);

  return (
    <>
      <PagePlate
        label="Journal"
        count={entries.length}
        countLabel=" 篇文章"
        title="只言片语"
        lede="技术心得与生活随笔，慢慢攒下的字。"
        image={{ src: plateEntry?.cover ? buildSrc(plateEntry.cover, "hero") : "/images/cover.jpg", position: "center 40%" }}
      />
      <section className="page-frame pb-20">
        <Suspense fallback={<CollectionLoading layout="journal" />}>
          <JournalList entries={entries} />
        </Suspense>
      </section>
    </>
  );
}
