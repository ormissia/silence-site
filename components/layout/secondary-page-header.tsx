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
    <header className="pb-6 md:pb-9">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-5">
            <h1 className="font-sans text-display font-semibold tracking-[-0.04em] capitalize">{titleEn.toLowerCase()}</h1>
            {count && <span className="text-sm tracking-normal text-muted">{count}</span>}
          </div>
          <p className="mt-3 hidden font-serif text-base italic text-muted md:mt-6 md:block">{DESCRIPTIONS[titleEn] ?? titleZh}</p>
        </div>
        <div className="max-w-sm md:text-right">
          <p className="mb-4 hidden text-xs uppercase tracking-[0.12em] text-muted md:block">{eyebrow}</p>
          <p className="whitespace-pre-line text-sm leading-relaxed tracking-normal text-muted">{lede}</p>
        </div>
      </div>
    </header>
  );
}
