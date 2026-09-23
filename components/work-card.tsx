import Image from "next/image";
import Link from "next/link";
import { buildSrc } from "@/lib/oss";
import type { Work } from "@/lib/works";
import { CoverFocusFrame } from "@/components/cover-focus-frame";
import { OverflowText } from "@/components/overflow-text";
import styles from "./cover-hover.module.css";

export function WorkCard({ work, index, variant = "wide" }: {
  work: Work; index: number; variant?: "tall" | "wide" | "square";
}) {
  const isFilm = work.series === "胶片";
  const aspect = variant === "tall" ? "aspect-[4/5]" : variant === "square" ? "aspect-square" : "aspect-video";
  return (
    <Link href={`/works/${work.slug}`} className={`${styles.link} editorial-card block`}>
      <div className={`${styles.cover} ${isFilm ? styles.film : ""} bg-black ${aspect}`}>
        <Image src={buildSrc(work.cover, "gridThumb")} alt={work.title} fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className={styles.image} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
        {isFilm && <div aria-hidden className="pointer-events-none absolute inset-0 border-[15px] border-solid" style={{ borderImageSource: 'url("/images/film/film-kodak-frame.webp")', borderImageSlice: 45, borderImageRepeat: "stretch" }} />}
        <div className={styles.topMetadata}>
          <span className="text-caption tracking-[0.25em] text-white/60">{String(index + 1).padStart(2, "0")}</span>
          <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-annotation text-white/75 backdrop-blur-sm">{work.series}</span>
        </div>
        <CoverFocusFrame />
        <div className={styles.info}>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-sm italic leading-snug text-ink/85"><OverflowText text={work.title} /></h3>
            <p className="mt-1.5 text-annotation text-muted">
              <OverflowText text={[work.location !== "—" ? work.location : "", work.date.slice(0, 4)].filter(Boolean).join(" · ")} />
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted"><OverflowText text={work.deck ?? ""} /></p>
          </div>
        </div>
      </div>
    </Link>
  );
}
