const DESCRIPTIONS: Record<string, string> = {
  WORKS: "Selected photographs, collected along the way.",
  JOURNAL: "Small observations. Notes on work and life.",
  READING: "Books, marked passages, and unfinished conversations.",
  ABOUT: "A note on the person behind the camera.",
};

export function SecondaryPageHeader({ eyebrow, titleEn, titleZh, lede, count }: {
  eyebrow: string; titleEn: string; titleZh: string; lede: string; count?: string;
}) {
  return (
    <header className="border-b divider-gradient pb-6 md:pb-9">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-5">
            <h1 className="font-sans text-display font-semibold tracking-[-0.04em] capitalize">{titleEn.toLowerCase()}</h1>
            {count && <span className="silence-pill text-muted"><span className="h-1.5 w-1.5 rounded-full bg-gradient-accent" />{count}</span>}
          </div>
          <p className="mt-3 font-serif text-sm italic text-muted md:mt-6">{DESCRIPTIONS[titleEn] ?? titleZh}</p>
        </div>
        <div className="max-w-sm md:text-right">
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted md:mb-4">{eyebrow}</p>
          <p className="text-deck tracking-normal text-muted">{lede}</p>
        </div>
      </div>
    </header>
  );
}
