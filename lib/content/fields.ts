/** 只复用现有字段规则，不把阅读导出的数字 ISBN 或 Date 自动转成字符串。 */
export function ensureString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function ensureNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

export function ensureStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  return undefined;
}

export function normalizeDateMaybe(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return ensureString(value);
}

/** Works / Journal 的手写 slug 会 trim；Reading 的手写 slug 保留原值。 */
export function resolveContentSlug(fileName: string, data: Record<string, unknown>): string {
  const explicit = typeof data.slug === "string" ? data.slug.trim() : "";
  return explicit || fileName;
}

export function resolveReadingSlug(fileName: string, data: Record<string, unknown>): string {
  const explicit = ensureString(data.slug);
  if (explicit) return explicit;
  const bookId = ensureString(data.bookId) ??
    (typeof data.bookId === "number" ? String(data.bookId) : undefined);
  if (bookId) return `b${bookId}`;
  const isbn = ensureString(data.isbn);
  if (isbn) return `isbn-${isbn.replace(/[^\w-]/g, "")}`;
  return `book-${fnv1aHex(fileName)}`;
}

function fnv1aHex(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
