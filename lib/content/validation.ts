import { CATEGORIES, TAB_SLUGS } from "../categories";
import { JOURNAL_CATEGORIES } from "../journal-categories";
import { resolveContentSlug, resolveReadingSlug } from "./fields";
import type { ContentKind, ContentSource } from "./types";

export type ContentIssue = {
  severity: "error" | "warning";
  sourcePath: string;
  field: string;
  message: string;
};

const present = (value: unknown) => value !== undefined && value !== null;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);

function isCalendarDate(value: string): boolean {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** YAML 会把 2026-02-30 滚到三月；在丢失原始字面量前检查根映射的日期字段。 */
export function assertValidDateLiterals(kind: ContentKind, source: ContentSource, frontmatter: string): void {
  const lines = frontmatter.split("\n");
  const indents = lines.flatMap((line) => {
    const key = /^(\s*)[\w"'][^:]*:/.exec(line);
    return key ? [key[1].length] : [];
  });
  const rootIndent = Math.min(...indents);
  for (const line of lines) {
    const match = /^([ \t]*)["']?(date|finishedDate|readingDate|lastReadDate)["']?[ \t]*:[ \t]*["']?(\d{4}-\d{2}-\d{2})(?=[ \tTZ#"']|$)/.exec(line);
    const knownDate = match && (kind === "reading" ? match[2] !== "date" : match[2] === "date");
    if (match && knownDate && match[1].length === rootIndent && source.data[match[2]] instanceof Date && !isCalendarDate(match[3])) {
      throw new Error(formatContentIssue({ severity: "error", sourcePath: source.sourcePath, field: match[2], message: `invalid calendar date "${match[3]}"` }));
    }
  }
}

/** 校验输入，不改写 frontmatter；未知导出字段和原有 fallback 保持兼容。 */
export function validateContent(kind: ContentKind, sources: ContentSource[]): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const slugs = new Map<string, string>();
  for (const source of sources) {
    const { data, sourcePath, fileName, pathSegments } = source;
    const add = (field: string, message: string, severity: ContentIssue["severity"] = "error") =>
      issues.push({ severity, sourcePath, field, message });
    const string = (field: string, required = false) => {
      const value = data[field];
      if (!present(value) && !required) return;
      if (typeof value !== "string" || (required && !value.trim())) add(field, "expected a string" + (required ? " with content" : ""));
    };
    const number = (field: string) => {
      if (present(data[field]) && (typeof data[field] !== "number" || !Number.isFinite(data[field]))) add(field, "expected a finite number");
    };
    const date = (field: string, required = false) => {
      const value = data[field];
      if ((!present(value) || value === "") && !required) return;
      if (value instanceof Date) {
        if (!Number.isFinite(value.getTime())) add(field, "invalid date");
      } else if (typeof value === "string" && value.length > 0) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          if (!isCalendarDate(value)) add(field, "invalid calendar date");
        } else {
          add(field, "non-ISO date preserved; check its display and sorting", "warning");
        }
      } else add(field, "expected a date or date string");
    };

    string("title", kind !== "reading" || present(data.title));
    string("slug");
    string("cover");
    if (typeof data.cover === "string" && /^https?:\/\//.test(data.cover)) {
      try { new URL(data.cover); } catch { add("cover", "invalid HTTP image URL"); }
    }

    if (kind === "reading") {
      for (const field of ["author", "category", "progress", "rating", "readingTime"]) string(field);
      for (const field of ["finishedDate", "readingDate", "lastReadDate"]) date(field);
      for (const field of ["readProgress", "totalWords", "noteCount"]) number(field);
      for (const field of ["bookId", "isbn"]) {
        const value = data[field];
        if (present(value) && typeof value !== "string" && !(typeof value === "number" && Number.isFinite(value))) add(field, "expected a string or finite number");
      }
      if (present(data.tags) && !(Array.isArray(data.tags) && data.tags.every((tag) => typeof tag === "string"))) add("tags", "expected a string array");
    } else {
      date("date", true);
      if (kind === "journal") {
        for (const field of ["category", "excerpt", "location", "mood"]) string(field);
        if (typeof data.category === "string" && !(JOURNAL_CATEGORIES as readonly string[]).includes(data.category.toLowerCase())) add("category", "unknown category; existing directory/life fallback will be used", "warning");
      } else {
        string("location", true);
        string("deck", true);
        string("series");
        string("album");
        const series = typeof data.series === "string" && data.series.length > 0
          ? data.series : TAB_SLUGS[pathSegments[0] as keyof typeof TAB_SLUGS];
        if (!series) add("series", "provide a series or a supported category directory");
        else if (!(CATEGORIES as readonly string[]).includes(series)) add("series", "unknown series; category navigation may omit this work", "warning");
        if (present(data.featured) && typeof data.featured !== "boolean") add("featured", "expected a boolean");
        if (!record(data.exif)) add("exif", "expected an object with camera and lens");
        else {
          for (const field of ["camera", "lens"]) if (typeof data.exif[field] !== "string") add(`exif.${field}`, "expected a string");
          if (present(data.exif.film) && typeof data.exif.film !== "string") add("exif.film", "expected a string");
        }
        if (present(data.photos)) {
          if (!Array.isArray(data.photos)) add("photos", "expected a photo array");
          else data.photos.forEach((photo, index) => {
            if (!record(photo) || typeof photo.key !== "string" || !photo.key.trim()) { add(`photos[${index}].key`, "expected a photo object with a nonempty key"); return; }
            if (present(photo.caption) && typeof photo.caption !== "string") add(`photos[${index}].caption`, "expected a string");
            for (const field of ["width", "height"]) if (present(photo[field]) && !(typeof photo[field] === "number" && Number.isFinite(photo[field]) && photo[field] > 0)) add(`photos[${index}].${field}`, "expected a positive finite dimension");
          });
        }
        if (data.album && !Array.isArray(data.photos) && typeof data.cover === "string" && data.cover.includes("/")) add("cover", "album cover is currently resolved as a filename; a full key/URL would be prefixed again", "warning");
      }
    }

    const slug = kind === "reading" ? resolveReadingSlug(fileName, data) : resolveContentSlug(fileName, data);
    if (!slug || slug === "." || slug === ".." || /[\/?#%\\\u0000-\u001f\u007f]/.test(slug)) add("slug", "must identify a single URL path segment");
    const previous = slugs.get(slug);
    if (previous) add("slug", `duplicate resolved slug "${slug}"; also defined in ${previous}`);
    else slugs.set(slug, sourcePath);
  }
  return issues;
}

export function formatContentIssue(issue: ContentIssue): string {
  return `${issue.sourcePath} [${issue.field}]: ${issue.message}`;
}

export function assertValidContent(kind: ContentKind, sources: ContentSource[]): void {
  const issues = validateContent(kind, sources);
  const errors = issues.filter((issue) => issue.severity === "error");
  if (errors.length) throw new Error(`Invalid ${kind} content:\n${errors.map(formatContentIssue).join("\n")}`);
  for (const issue of issues) console.warn(`[content] ${formatContentIssue(issue)}`);
}
