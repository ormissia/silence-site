/** Split the known export metadata section without discarding custom notes. */
export function splitReadingMarkdown(markdown: string, title: string) {
  const lines = markdown.split("\n");
  const metadataStart = lines.findIndex((line) => /^#\s+元数据\s*$/.test(line));
  if (metadataStart < 0) return { metadata: "", notes: markdown };

  let metadataEnd = metadataStart + 1;
  while (metadataEnd < lines.length && !/^#\s+/.test(lines[metadataEnd])) metadataEnd++;
  const metadata = lines.slice(metadataStart + 1, metadataEnd)
    // The real cover and book title already appear in the header.
    .filter((line) =>
      !/^>\s*-\s*!\[.*\]\(.*\)\s*$/.test(line) &&
      !/^>\s*-\s*(?:书名|作者)[：:]\s*/.test(line)
    )
    // Format only the publication field; preserve dates and times in personal notes.
    .map((line) => line.replace(/^(>\s*-\s*(?:\*\*)?出版时间(?:\*\*)?[：:]?\s*\d{4}-\d{2}-\d{2})[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\s*$/, "$1"))
    .map((line) => line.replace(/^>\s*-\s*(书名|作者|简介|出版时间|ISBN|分类|出版社)(?:[：:]\s*|\s+)(.*)$/, "> - **$1**\n>   $2"))
    .join("\n").replace(/\n\s*---\s*$/, "").trim();
  const before = lines.slice(0, metadataStart);
  const firstContent = before.findIndex((line) => line.trim());
  if (firstContent >= 0 && before[firstContent].trim() === `# ${title}`) before.splice(firstContent, 1);
  const notes = [...before, ...lines.slice(metadataEnd)].join("\n").trim();
  return { metadata, notes };
}
