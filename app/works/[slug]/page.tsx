import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildSrc } from "@/lib/oss";
import { getWork, listWorks } from "@/lib/works";
import { PlatesGrid } from "@/components/work/plates-grid";

import { FilmNotes } from "@/components/work/film-notes";

export async function generateStaticParams() {
  return (await listWorks()).map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const work = await getWork(params.slug);
  if (!work) return {};
  return { title: `${work.title} — SILENCE` };
}

export default async function WorkDetailPage({ params }: { params: { slug: string } }) {
  const work = await getWork(params.slug);
  if (!work) notFound();

  const all = await listWorks();
  const idx = all.findIndex((w) => w.slug === work.slug);
  const next = all[(idx + 1) % all.length];

  const isFilm = work.series === "胶片";
  return (
    <article className="pb-20">
      {/* Cover hero：单独占满一屏，只显示封面 + 标题 */}
      <header className={`relative w-full overflow-hidden bg-black ${isFilm ? "mt-[var(--site-header-height)] h-[calc(100svh-var(--site-header-height))] min-h-[440px]" : "h-screen min-h-[560px]"}`}>
        <Image
          src={buildSrc(work.cover, "hero")}
          alt={work.title}
          fill
          priority
          className={isFilm ? "object-cover p-4 md:p-5" : "cinema-tone-soft object-cover"}
          sizes="100vw"
        />
        {isFilm && <Image src="/images/film/film-hero-overlay.webp" alt="" fill sizes="100vw" className="pointer-events-none z-[1] object-fill opacity-60 mix-blend-screen" aria-hidden />}
        <Link href={isFilm ? "/works?tab=film" : "/works"} className={`silence-pill absolute left-6 z-20 bg-black/40 text-white backdrop-blur-sm md:left-12 ${isFilm ? "top-8" : "top-36"}`}>← Works</Link>
        {/* 暗化让标题在亮区也立得住 */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/75"
        />
        <div className="vignette absolute inset-0" />

        <div className={`relative z-10 mx-auto flex h-full max-w-[1100px] flex-col items-center px-6 text-center md:px-10 ${isFilm ? "justify-center py-24" : "justify-end pb-20 md:pb-28"}`}>
          <p className="font-sans text-caption uppercase tracking-[0.24em] text-white/80">
            {[work.series, work.location !== "—" ? work.location : "", work.date.slice(0, 4)].filter(Boolean).join(" — ")}
          </p>
          <h1 className={`mt-4 text-display text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.5)] ${isFilm ? "font-sans font-semibold" : "font-serif"}`}>
            {work.title.split(",")[0]}
            {work.title.includes(",") && (
              <>
                ,<br />
                <span className="italic">{work.title.split(",").slice(1).join(",").trim()}</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-6 max-w-column font-sans text-lede text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]">
            {work.deck}
          </p>
        </div>
      </header>

      {/* Story + EXIF rail */}
      {isFilm ? <FilmNotes work={work} /> : <section className="mx-auto mt-16 max-w-[1400px] px-6 md:mt-20 md:px-10">
        <div className="grid grid-cols-12 gap-x-8 gap-y-10 border-t border-rule pt-12">
          <aside className="col-span-12 md:col-span-3">
                <p className="eyebrow">Plate Notes</p>
                <dl className="mt-4 space-y-3 font-sans text-sm">
                  <div>
                    <dt className="text-label uppercase tracking-[0.18em] text-muted">Camera</dt>
                    <dd>{work.exif.camera}</dd>
                  </div>
                  <div>
                    <dt className="text-label uppercase tracking-[0.18em] text-muted">Lens</dt>
                    <dd>{work.exif.lens}</dd>
                  </div>
                  {work.exif.film && (
                    <div>
                      <dt className="text-label uppercase tracking-[0.18em] text-muted">Film</dt>
                      <dd>{work.exif.film}</dd>
                    </div>
                  )}
                </dl>
          </aside>

          <div className="col-span-12 md:col-span-9 md:col-start-4">
            {work.story.map((paragraph, i) => (
              <p
                key={i}
                className={`max-w-column font-sans text-lede leading-relaxed ${
                  i === 0 ? "drop-cap" : "mt-6"
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>}

      {/* Plates grid */}
      <section className={`mx-auto max-w-[1400px] px-6 md:px-12 ${isFilm ? "mt-4" : "mt-24"}`}>
        {isFilm && <div className="mb-6 flex items-center justify-between border-t divider-gradient pt-6 text-annotation uppercase tracking-[0.2em] text-muted"><span>Contact sheets</span><span>{work.photos.length} frames · Click to view</span></div>}
        <PlatesGrid photos={work.photos} workTitle={work.title} film={isFilm} />
      </section>

      {/* Next */}
      <section className="mx-auto mt-32 max-w-[1400px] px-6 md:px-10">
        <Link
          href={`/works/${next.slug}`}
          className="group block border-t border-rule pt-8"
        >
          <p className="eyebrow">Next Story</p>
          <div className="mt-3 flex items-baseline justify-between gap-6">
            <h3 className="font-serif text-headline group-hover:text-accent">
              {next.title}
            </h3>
            <span className="hidden font-sans text-label uppercase tracking-[0.18em] text-muted group-hover:text-accent md:inline">
              Continue →
            </span>
          </div>
        </Link>
      </section>
    </article>
  );
}
