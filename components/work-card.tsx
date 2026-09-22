import Image from "next/image";
import Link from "next/link";
import { buildSrc } from "@/lib/oss";
import type { Work } from "@/lib/works";

export function WorkCard({ work, index, variant = "wide" }: {
  work: Work; index: number; variant?: "tall" | "wide" | "square";
}) {
  const isFilm = work.series === "胶片";
  const aspect = variant === "tall" ? "aspect-[4/5]" : variant === "square" ? "aspect-square" : "aspect-video";
  return (
    <Link href={`/works/${work.slug}`} className="editorial-card group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
      <div className={`relative overflow-hidden bg-black ${aspect}`}>
        <Image src={buildSrc(work.cover, "gridThumb")} alt={work.title} fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
        {isFilm && <div aria-hidden className="pointer-events-none absolute inset-0 border-[15px] border-solid" style={{ borderImageSource: 'url("/images/film/film-kodak-frame.webp")', borderImageSlice: 45, borderImageRepeat: "stretch" }} />}
        <div className={`absolute inset-x-0 top-0 flex items-center justify-between ${isFilm ? "p-7" : "p-4"}`}>
          <span className="text-caption tracking-[0.25em] text-white/60">{String(index + 1).padStart(2, "0")}</span>
          <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-annotation text-white/75 backdrop-blur-sm">{work.series}</span>
        </div>
        <p className={`absolute text-caption tracking-[0.12em] text-white/70 ${isFilm ? "bottom-7 left-7" : "bottom-4 left-4"}`}>
          {[work.location, work.date.slice(0, 4)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="flex items-start justify-between gap-4 border-t border-white/[0.07] px-4 py-4">
        <div className="min-w-0">
          <h3 className="font-serif text-sm italic leading-snug text-ink/85">{work.title}</h3>
          {work.deck && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{work.deck}</p>}
        </div>
        <span className="silence-pill shrink-0 text-muted">View <span aria-hidden>→</span></span>
      </div>
    </Link>
  );
}
