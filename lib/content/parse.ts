import { assertValidContent } from "./validation";
import { ensureNumber, ensureString, ensureStringArray, normalizeDateMaybe, resolveContentSlug, resolveReadingSlug } from "./fields";
import type { ContentSource, ParsedContent, ParsedWorkSource } from "./types";
import type { ReadingMetadata } from "../reading/types";
import type { JournalSummary } from "../journal/types";
import { JOURNAL_CATEGORIES } from "../journal-categories";
import { TAB_SLUGS } from "../categories";
import type { Photo } from "../works/types";

const HIDDEN_TAGS = new Set(["读书笔记"]);
const FINISHED_TAGS = new Set(["读完", "已读", "读毕", "看完"]);

/** Required fields are checked by validation; keep the narrowing at this boundary. */
function requiredString(value: unknown): string {
  if (typeof value !== "string") throw new Error("Expected a validated string field");
  return value;
}

// Unlike ensureString, preserve an explicitly empty optional journal field.
function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function requiredRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || value instanceof Date) throw new Error("Expected a validated object field");
  return value as Record<string, unknown>;
}

export function parseWorkSources(sources: ContentSource[]): ParsedWorkSource[] {
  assertValidContent("works", sources);
  return sources.map(({ sourcePath, fileName, pathSegments, data, storyMd }) => {
    const exif = requiredRecord(data.exif);
    const photos: Photo[] | undefined = Array.isArray(data.photos) ? data.photos.map((value: unknown) => {
      const photo = requiredRecord(value);
      return { key: requiredString(photo.key), caption: optionalString(photo.caption), width: ensureNumber(photo.width), height: ensureNumber(photo.height) };
    }) : undefined;
    const album = ensureString(data.album);
    const directory = pathSegments.length ? `works/${pathSegments.join("/")}` : "works";
    const seriesFromPath = Object.entries(TAB_SLUGS).find(([key]) => key === pathSegments[0])?.[1];
    return {
      sourcePath,
      storyMd,
      albumPrefix: album && !photos ? `${directory}/${album.replace(/^\/+|\/+$/g, "")}` : undefined,
      photos,
      metadata: {
        slug: resolveContentSlug(fileName, data),
        title: requiredString(data.title),
        series: ensureString(data.series) ?? seriesFromPath ?? "",
        date: normalizeDateMaybe(data.date) ?? "",
        location: requiredString(data.location),
        cover: optionalString(data.cover) ?? "",
        deck: requiredString(data.deck),
        exif: { camera: requiredString(exif.camera), lens: requiredString(exif.lens), film: optionalString(exif.film) },
        featured: typeof data.featured === "boolean" ? data.featured : undefined,
      },
    };
  });
}

export function parseJournalSources(sources: ContentSource[]): ParsedContent<JournalSummary>[] {
  assertValidContent("journal", sources);
  return sources.map(({ sourcePath, fileName, pathSegments, data, storyMd }) => {
    const fromData = optionalString(data.category)?.toLowerCase();
    const fromPath = pathSegments[0]?.toLowerCase();
    const category = JOURNAL_CATEGORIES.find((value) => value === fromData)
      ?? JOURNAL_CATEGORIES.find((value) => value === fromPath) ?? "life";
    const cover = ensureString(data.cover);
    return {
      sourcePath,
      storyMd,
      metadata: {
        slug: resolveContentSlug(fileName, data),
        title: requiredString(data.title),
        date: normalizeDateMaybe(data.date) ?? "",
        category,
        cover: cover && !cover.includes("/") ? `journal/${category}/${cover}` : cover,
        excerpt: optionalString(data.excerpt),
        location: optionalString(data.location),
        mood: optionalString(data.mood),
      },
    };
  });
}

/** Validate once at the boundary; callers only receive normalized metadata and raw prose. */
export function parseReadingSources(sources: ContentSource[]): ParsedContent<ReadingMetadata>[] {
  assertValidContent("reading", sources);
  return sources.map(({ sourcePath, fileName, pathSegments, data, storyMd }) => {
    const tags = ensureStringArray(data.tags);
    const finished = tags?.some((tag) => FINISHED_TAGS.has(tag)) ?? false;
    const visibleTags = tags?.filter((tag) => !HIDDEN_TAGS.has(tag));
    const rawCategory = ensureString(data.category);
    const category = rawCategory?.split(/\s+/)[0]?.trim() || pathSegments[0] || "未分类";
    return {
      sourcePath,
      storyMd,
      metadata: {
        slug: resolveReadingSlug(fileName, data),
        title: typeof data.title === "string" ? data.title : fileName,
        author: ensureString(data.author),
        cover: ensureString(data.cover),
        progress: finished ? "100%" : ensureString(data.progress),
        rating: ensureString(data.rating),
        readProgress: finished ? 100 : ensureNumber(data.readProgress),
        readingTime: ensureString(data.readingTime),
        // These two export fields deliberately ignore YAML Date objects.
        readingDate: ensureString(data.readingDate),
        lastReadDate: ensureString(data.lastReadDate),
        finishedDate: normalizeDateMaybe(data.finishedDate),
        category,
        rawCategory,
        tags: visibleTags?.length ? visibleTags : undefined,
        isbn: ensureString(data.isbn),
        totalWords: ensureNumber(data.totalWords),
        noteCount: ensureNumber(data.noteCount),
      },
    };
  });
}
