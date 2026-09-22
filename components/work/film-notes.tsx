import Image from "next/image";
import type { Work } from "@/lib/works";

/** The sleeve is decorative; metadata and notes always come from the actual work. */
export function FilmNotes({ work }: { work: Work }) {
  const film = work.exif.film;
  const iso = film ? /\b(\d{2,4})\b/.exec(film)?.[1] : undefined;
  const meta = [
    ["Camera", work.exif.camera],
    ["Lens", work.exif.lens],
    ["Frames", String(work.photos.length).padStart(2, "0")],
  ];

  return (
    <section className="mx-auto grid max-w-[1400px] gap-10 px-6 py-12 md:grid-cols-[220px_1fr] md:px-12 lg:grid-cols-[280px_1fr] lg:gap-12 lg:py-16">
      <aside className="film-sleeve relative mx-auto w-full max-w-[340px] self-start">
        <Image src="/images/film/film-sleeve.webp" alt="" fill sizes="340px" className="pointer-events-none object-fill" aria-hidden />
        <div className="relative z-10 px-[14%] py-12">
          <p className="text-annotation uppercase tracking-[0.24em] text-accent">Film Sleeve</p>
          <h2 className="mt-5 text-xl font-semibold leading-snug">{film || "Film archive"}</h2>
          {iso && <p className="mt-2 text-caption tracking-widest text-muted">ISO {iso}</p>}
          <dl className="mt-8 space-y-5">
            {meta.map(([label, value]) => (
              <div key={label}>
                <dt className="text-annotation uppercase tracking-[0.2em] text-muted">{label}</dt>
                <dd className="mt-1 text-label tracking-normal text-ink/80">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>

      <div className="grid content-start gap-8 xl:grid-cols-[minmax(180px,1fr)_2fr]">
        <div>
          <p className="text-annotation uppercase tracking-[0.22em] text-muted">Film — {work.date.slice(0, 4)}</p>
          <h2 className="mt-5 text-2xl font-semibold leading-tight">{work.title}</h2>
          <p className="mt-6 text-caption uppercase tracking-[0.15em] text-accent">{String(work.photos.length).padStart(2, "0")} frames · {film || "Film"}</p>
          {work.location && work.location !== "—" && <p className="mt-3 text-xs text-muted">{work.location}</p>}
          <p className="mt-8 font-serif text-lg italic text-ink/75">A note before the scan.</p>
        </div>
        <div className="border-t border-dashed border-accent/30 pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
          {work.story.length > 0 ? work.story.map((paragraph, i) => (
            <p key={i} className="film-note-paragraph text-body leading-[1.95] text-ink/65">{paragraph}</p>
          )) : <p className="text-body text-muted">这一卷的笔记待补。</p>}
        </div>
      </div>
    </section>
  );
}
