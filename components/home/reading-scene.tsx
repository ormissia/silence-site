"use client";

import Link from "next/link";
import { useRef } from "react";
import { BookRows } from "./book-rows";
import { ReadingFinale } from "./reading-finale";
import { SCENE_STOPS, useReadingScene, type SceneBook } from "./use-reading-scene";
import { getAccentStyle } from "@/lib/accent";
import styles from "./reading-scene.module.css";

export function ReadingScene({ books: supplied }: { books: SceneBook[] }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const { books, selected, transitioning, ready, reduced, save } = useReadingScene(root, stage, supplied);
  const finale = selected && <ReadingFinale book={selected.book} width={selected.width} ready={ready} reduced={reduced} />;
  const bookHeading = selected && <header className={styles.finalHeader} aria-hidden={!ready || undefined}>
    {selected.book.author && <p className="font-sans text-caption text-muted">{selected.book.author}</p>}
    <h2 className="mt-3 font-sans text-headline font-normal">{selected.book.title}</h2>
  </header>;

  return <div ref={root} className={styles.scene} data-home-snap-point="reading" data-reading-scene
    data-reduced={reduced} data-empty={!books.length} onClickCapture={event => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href*="view=home"]');
      if (link && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) save();
    }}>
    <div ref={stage} className={styles.stage}>
      <header className={styles.header} aria-hidden={transitioning || undefined}>
        <p className="font-sans text-caption uppercase text-muted">Reading &amp; Notes</p>
        <h2 id="reading-heading" className="mt-4 font-sans text-headline font-normal leading-[1.35] tracking-[0.04em]">字里行间</h2>
      </header>
      <Link href="/reading" style={getAccentStyle("home:reading")} tabIndex={transitioning ? -1 : undefined}
        aria-hidden={transitioning || undefined} className={`${styles.shelfLink} silence-pill silence-pill-accent font-sans text-ink`}>
        进入书架 <span aria-hidden>→</span>
      </Link>
      <div className={styles.wall}>
        <BookRows books={books} transitioning={transitioning} retainedId={reduced ? undefined : selected?.id} />
      </div>
      {!reduced && bookHeading}
      {!reduced && finale}
    </div>
    {reduced && <div className={styles.staticFinale}>{bookHeading}{finale}</div>}
    {!reduced && books.length > 0 && <span className={styles.endMarker} data-home-snap-point="reading-end"
      style={{ top: `calc(var(--scene-travel) * ${SCENE_STOPS.finish})` }} aria-hidden />}
  </div>;
}
