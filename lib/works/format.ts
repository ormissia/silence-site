/** 胶卷标题形如 "No.0028 · Vision3 5207"，slug 形如 "0028-135-5207"。 */
export function parseFilmRoll(title: string, slug: string): { roll?: string; stock: string; format?: string } {
  const match = /^No\.?\s*(\d+)\s*[·・\-—]\s*(.+)$/.exec(title.trim());
  const format = /^\d+-(120|135)-/.exec(slug)?.[1];
  return match ? { roll: match[1], stock: match[2].trim(), format } : { stock: title, format };
}

/** 2025-11-01 → 2025.11 */
export function formatWorkMonth(date: string): string {
  return date.slice(0, 7).replace("-", ".");
}
