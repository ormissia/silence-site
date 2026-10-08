/** Query values shared by reading list entries, detail returns and next-book links. */
export type ReadingNavigationContext = {
  cat?: string | string[] | null;
  view?: string | string[] | null;
};

function readingQuery({ cat, view }: ReadingNavigationContext) {
  if (view === "evolution") return "?view=evolution";
  return typeof cat === "string" && cat && cat !== "all" ? `?cat=${encodeURIComponent(cat)}` : "";
}

export function readingListHref(context: ReadingNavigationContext = {}) {
  return context.view === "evolution" ? "/reading/evolution" : `/reading${readingQuery(context)}`;
}

export function readingBookHref(slug: string, context: ReadingNavigationContext = {}) {
  return `/reading/${slug}${readingQuery(context)}`;
}
