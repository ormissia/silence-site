import Link from "next/link";
import Image from "next/image";
import { buildSrc } from "@/lib/oss";
import type { Work } from "@/lib/works";

type Props = {
  works: Work[];
};

export function SelectedWorks({ works }: Props) {
  if (works.length === 0) return null;

  return (
    <section aria-labelledby="selected-works-heading" className="relative z-20 bg-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-28">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-sans text-caption uppercase text-muted">Selected Works</p>
            <h2 id="selected-works-heading" className="mt-4 font-sans text-headline font-normal tracking-[0.04em]">
              光的片段
            </h2>
          </div>
          <Link
            href="/works"
            className="inline-flex items-center gap-4 rounded-lg border border-ink/20 px-5 py-3 font-sans text-label tracking-normal text-ink/80 transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            全部作品 <span aria-hidden>↗</span>
          </Link>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-12 md:grid-cols-3">
          {works.slice(0, 3).map((work) => (
            <Link
              key={work.slug}
              href={`/works/${work.slug}`}
              className="group block min-w-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
                <Image
                  src={buildSrc(work.cover, "gridThumb")}
                  alt={work.title}
                  fill
                  sizes="(min-width: 1400px) 420px, (min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              </div>
              <div className="mt-5 flex items-center justify-between gap-4 font-sans text-caption tracking-normal text-muted">
                <span>{work.series}</span>
                <span>{[work.location === "—" ? "" : work.location, work.date.slice(0, 4)].filter(Boolean).join(" · ")}</span>
              </div>
              <div className="mt-2 flex items-start justify-between gap-4">
                <h3 className="font-serif text-lede leading-relaxed text-ink transition-colors group-hover:text-accent">
                  {work.title}
                </h3>
                <span aria-hidden className="mt-1 text-label text-muted transition-colors group-hover:text-accent">↗</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
