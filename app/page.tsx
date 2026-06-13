import { Suspense } from "react";
import Link from "next/link";
import { CinemaHero } from "@/components/cinema-hero";
import { BookSphere } from "@/components/home/book-sphere";
import { TodayHighlight } from "@/components/home/today-highlight";
import { listFeatured, listWorks } from "@/lib/works";
import { getDailyIndex, listHighlights, listReading } from "@/lib/reading";

export default async function HomePage() {
  const featured = await listFeatured();
  const hero = featured[0] ?? (await listWorks())[0];

  // 取所有有封面的读书笔记，最多 50 本，给球用
  const sphereBooks = listReading()
    .filter((b) => b.cover)
    .slice(0, 50)
    .map((b) => ({
      slug: b.slug,
      title: b.title,
      author: b.author,
      cover: b.cover,
    }));

  const highlights = listHighlights();
  const startIndex = getDailyIndex();

  return (
    <>
      <Suspense fallback={<div className="h-screen bg-paper" />}>
        <CinemaHero work={hero} />
      </Suspense>

      {/* 阅读区：3D 书球 + 今日一句，背景用 cover.jpg */}
      <section
        className="relative z-20 -mt-px overflow-hidden bg-paper"
        style={{
          backgroundImage: "url('/images/cover.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* 暗化叠层让书球与文字立得住 */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-paper/95 via-paper/80 to-paper/95"
        />
        <div
          aria-hidden
          className="vignette pointer-events-none absolute inset-0"
        />

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-32 md:px-10 md:py-40">
          <header className="mx-auto max-w-[900px] text-center">
            <p className="eyebrow">From the Bookshelf</p>
            <h2 className="mt-3 font-sans text-display leading-[0.95]">
              寂静无声
            </h2>
            <p className="mx-auto mt-6 max-w-column font-sans text-lede text-ink/80">
              划过的句子比走过的路更长。把它们围成一颗星球，每一面都通向一段未完的对话。
            </p>
          </header>

          {sphereBooks.length > 0 && (
            <div className="mt-16 flex justify-center md:mt-24">
              <BookSphere books={sphereBooks} radius={320} size={96} />
            </div>
          )}

          {/* Enter the Reading：放在 3D 球下方，作为视觉收口 */}
          <div className="mt-12 flex justify-center md:mt-16">
            <Link
              href="/reading"
              className="inline-flex items-center gap-3 border border-ink/30 bg-ink/5 px-6 py-3 font-sans text-xs uppercase tracking-[0.24em] backdrop-blur-sm transition hover:scale-105 hover:border-accent hover:text-accent"
            >
              Enter the Reading <span aria-hidden>→</span>
            </Link>
          </div>

          {highlights.length > 0 && (
            <div className="mt-24 md:mt-32">
              <TodayHighlight highlights={highlights} startIndex={startIndex} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
