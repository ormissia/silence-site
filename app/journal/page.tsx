import { Suspense } from "react";
import { listJournal } from "@/lib/journal";
import { JournalList } from "@/components/journal/journal-list";

export const metadata = {
  title: "Journal — SILENCE",
};

export default function JournalPage() {
  const entries = listJournal();

  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 md:px-10 md:pt-40">
      <header className="border-b border-rule pb-10">
        <p className="eyebrow">Journal — Notes & Essays</p>
        <h1 className="mt-3 font-sans text-display">
          JOURNAL <span className="text-muted">/</span>{" "}
          <span className="italic">文章</span>
        </h1>
        <p className="mt-6 max-w-column font-sans text-lede text-ink/80">
          技术心得与生活随笔——慢慢攒下的字。
        </p>
      </header>

      <Suspense
        fallback={
          <div className="mt-12 h-[60vh] border-b border-rule/60" aria-hidden />
        }
      >
        <JournalList entries={entries} />
      </Suspense>
    </section>
  );
}
