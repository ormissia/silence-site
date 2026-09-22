const DESCRIPTIONS: Record<string, string> = {
  WORKS: "Selected photographs, collected along the way.",
  JOURNAL: "Small observations. Notes on work and life.",
  READING: "Books, marked passages, and unfinished conversations.",
};

export function SecondaryPageHeader({ eyebrow, titleEn, titleZh, lede, count }: {
  eyebrow: string; titleEn: string; titleZh: string; lede: string; count?: string;
}) {
  return (
    <header className="border-b divider-gradient pb-9">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-5">
            <h1 className="font-sans text-display font-semibold tracking-[-0.04em] capitalize">{titleEn.toLowerCase()}</h1>
            {count && <span className="silence-pill text-muted"><span className="h-1.5 w-1.5 rounded-full bg-gradient-accent" />{count}</span>}
          </div>
          <p className="mt-6 font-serif text-sm italic text-muted">{DESCRIPTIONS[titleEn] ?? titleZh}</p>
        </div>
        <div className="max-w-sm md:text-right">
          <p className="mb-4 text-annotation uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
          <p className="text-deck tracking-normal text-muted">{lede}</p>
        </div>
      </div>
    </header>
  );
}
