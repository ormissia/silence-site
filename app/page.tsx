import { Suspense } from "react";
import Link from "next/link";
import { CinemaHero } from "@/components/cinema-hero";
import { BookSphere } from "@/components/home/book-sphere";
import { HomeSplash } from "@/components/home/home-splash";
import { TodayHighlight } from "@/components/home/today-highlight";
import { ReadingReveal } from "@/components/home/reading-reveal";
import { SelectedWorks } from "@/components/home/selected-works";
import { listFeatured, listWorks } from "@/lib/works";
import { getDailyIndex, listHighlights, pickSphereBooks } from "@/lib/reading";

// 球面书籍每次刷新都换一批，依赖运行时随机 seed → 不能预渲染。
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await listFeatured();
  const hero = featured[0] ?? (await listWorks())[0];

  // 每次请求重新洗牌，从所有有封面的书里抽 50 本上球。
  // 不传 seed → 默认 Date.now()，每次刷新换一批。
  const sphereBooks = pickSphereBooks(50).map((b) => ({
    slug: b.slug,
    title: b.title,
    author: b.author,
    cover: b.cover,
  }));

  const highlights = listHighlights();
  const startIndex = getDailyIndex();

  return (
    <>
      <HomeSplash />
      <Suspense fallback={<div className="h-screen bg-paper" />}>
        <CinemaHero work={hero} />
      </Suspense>

      <SelectedWorks works={featured} />

      {/* 阅读区：3D 书球 + 今日一句，背景用 cover.jpg */}
      <section
        aria-labelledby="reading-heading"
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
          className="pointer-events-none absolute inset-0 bg-paper/70"
        />
        {/* 与序章尾部同色，背景从近黑底色中逐渐显露。 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[30vh] bg-gradient-to-b from-paper to-transparent"
        />
        <div
          aria-hidden
          className="vignette pointer-events-none absolute inset-0"
        />
        {/* 背景在页尾融入全站底色，文字与控件保持原有清晰度。 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(12rem,30vh,24rem)] bg-gradient-to-b from-transparent via-paper/60 to-paper"
        />

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
          <ReadingReveal>
            <header className="lg:col-span-5">
              <p className="font-sans text-caption uppercase text-muted">From the Bookshelf</p>
              <h2 id="reading-heading" className="mt-6 font-sans text-display font-light leading-tight">
                寂静无声
              </h2>
              <p className="mt-6 max-w-sm font-sans text-body text-ink/70">
                划过的句子比走过的路更长。把它们围成一颗星球，每一面都通向一段未完的对话。
              </p>
              <Link
                href="/reading"
                className="mt-10 inline-flex items-center gap-4 rounded-lg border border-ink/20 bg-ink/5 px-6 py-3 font-sans text-label uppercase transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Enter the Reading <span aria-hidden>→</span>
              </Link>
            </header>

            {sphereBooks.length > 0 && (
              <div className="min-w-0 lg:col-span-7">
                <BookSphere books={sphereBooks} radius={240} size={76} />
              </div>
            )}
          </ReadingReveal>

          {highlights.length > 0 && (
            <div className="mt-16 pt-16 md:mt-24 md:pt-20">
              <TodayHighlight highlights={highlights} startIndex={startIndex} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
