import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildSrc } from "@/lib/oss";
import { getWork, listWorks, type Work } from "@/lib/works";
import { PlatesGrid } from "@/components/work/plates-grid";

/**
 * 胶片作品专属 EXIF 面板：胶卷信封 / 冲洗单的视觉。
 * 排版接近真实底片信封：胶卷型号大字、ISO、相机、镜头、冲洗法、底片号。
 */
function FilmExifPanel({ work }: { work: Work }) {
  const filmStock = work.exif.film;
  const filmIso = filmStock ? /\b(\d{2,4})\b/.exec(filmStock)?.[1] : undefined;
  const plateCount = work.photos.length;
  return (
    <div className="border border-amber-500/30 bg-amber-500/5 p-5 font-sans">
      <p className="eyebrow text-amber-300/80">Film Sleeve</p>
      <p className="mt-4 text-2xl font-semibold leading-tight text-amber-100">
        {filmStock ?? "Unknown Stock"}
      </p>
      {filmIso && (
        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-amber-200/70">
          ISO {filmIso} · 35mm · C-41
        </p>
      )}
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Camera</dt>
          <dd className="text-ink">{work.exif.camera}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Lens</dt>
          <dd className="text-ink">{work.exif.lens}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Develop</dt>
          <dd className="text-ink">C-41 / Standard</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Negatives</dt>
          <dd className="text-ink">
            No. {String(1).padStart(2, "0")} – {String(plateCount).padStart(2, "0")}
          </dd>
        </div>
      </dl>
    </div>
  );
}

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

  return (
    <article>
      {/* Cover hero：单独占满一屏，只显示封面 + 标题 */}
      <header className="relative h-screen min-h-[560px] w-full overflow-hidden bg-ink/5">
        <Image
          src={buildSrc(work.cover, "hero")}
          alt={work.title}
          fill
          priority
          className="cinema-tone object-cover"
          sizes="100vw"
        />
        {/* 暗化让标题在亮区也立得住 */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/75"
        />
        <div className="vignette absolute inset-0" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1100px] flex-col items-center justify-end px-6 pb-20 text-center md:px-10 md:pb-28">
          <p className="eyebrow text-white/80">
            {work.series} — {work.location} — {work.date.slice(0, 4)}
          </p>
          <h1 className="mt-4 font-sans text-display text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.5)]">
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
      <section className="mx-auto mt-16 max-w-[1400px] px-6 md:mt-20 md:px-10">
        <div className="grid grid-cols-12 gap-x-8 gap-y-10 border-t border-rule pt-12">
          <aside className="col-span-12 md:col-span-3">
            {work.series === "胶片" ? (
              <FilmExifPanel work={work} />
            ) : (
              <>
                <p className="eyebrow">Plate Notes</p>
                <dl className="mt-4 space-y-3 font-sans text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-muted">Camera</dt>
                    <dd>{work.exif.camera}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-muted">Lens</dt>
                    <dd>{work.exif.lens}</dd>
                  </div>
                  {work.exif.film && (
                    <div>
                      <dt className="text-xs uppercase tracking-[0.18em] text-muted">Film</dt>
                      <dd>{work.exif.film}</dd>
                    </div>
                  )}
                </dl>
              </>
            )}
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
      </section>

      {/* Plates grid */}
      <section className="mx-auto mt-24 max-w-[1400px] px-6 md:px-10">
        <PlatesGrid photos={work.photos} workTitle={work.title} />
      </section>

      {/* Next */}
      <section className="mx-auto mt-32 max-w-[1400px] px-6 md:px-10">
        <Link
          href={`/works/${next.slug}`}
          className="group block border-t border-rule pt-8"
        >
          <p className="eyebrow">Next Story</p>
          <div className="mt-3 flex items-baseline justify-between gap-6">
            <h3 className="font-sans text-headline group-hover:text-accent">
              {next.title}
            </h3>
            <span className="hidden font-sans text-sm uppercase tracking-[0.18em] text-muted group-hover:text-accent md:inline">
              Continue →
            </span>
          </div>
        </Link>
      </section>
    </article>
  );
}
