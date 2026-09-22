import Link from "next/link";
import Image from "next/image";
import { buildSrc } from "@/lib/oss";
import type { Work } from "@/lib/works";
import styles from "./selected-works.module.css";

type Props = {
  works: Work[];
};

export function SelectedWorks({ works }: Props) {
  if (works.length === 0) return null;

  return (
    <section aria-labelledby="selected-works-heading" className="relative z-20 bg-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-28">
        <header className="text-center">
          <p className="font-sans text-caption uppercase text-muted">Selected Works</p>
          <h2 id="selected-works-heading" className="mt-4 font-sans text-headline font-normal leading-[1.35] tracking-[0.04em]">
            光的片段
          </h2>
        </header>

        <div className={`${styles.gallery} mt-10 md:mt-12`}>
          {works.slice(0, 5).map((work) => (
            <Link
              key={work.slug}
              href={`/works/${work.slug}`}
              className={`${styles.card} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`}
            >
              <Image
                src={buildSrc(work.cover, "gridThumb")}
                alt={work.title}
                fill
                sizes="(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw"
                className={`${styles.image} object-cover`}
              />
              <div className={styles.caption}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-sans text-caption tracking-normal text-white/75">
                  <span>{work.series}</span>
                  <span>{[work.location === "—" ? "" : work.location, work.date.slice(0, 4)].filter(Boolean).join(" · ")}</span>
                </div>
                <div className="mt-2 flex items-start justify-between gap-4">
                  <h3 className="font-serif text-lede leading-relaxed text-white">
                    {work.title}
                  </h3>
                  <span aria-hidden className="mt-1 text-label text-white/75">↗</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 flex justify-center md:mt-12">
          <Link href="/works" className="silence-pill font-sans text-ink/80">
            全部作品 <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
