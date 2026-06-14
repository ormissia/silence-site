import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const WORKS_DIR = path.join(process.cwd(), "content/works");
const FILM_DIR = path.join(process.cwd(), "content/film");
const JOURNAL_DIR = path.join(process.cwd(), "content/journal");
const READING_DIR = path.join(process.cwd(), "content/reading");

export type WorkRaw = {
  slug: string;
  /** 文件相对于扫描根目录的路径段（不含文件名）。
   *  例：content/reading/哲学宗教/理想国.md → ["哲学宗教"]。
   *  顶层文件为空数组。Reading 用它做"目录即一级分类"的 fallback。 */
  pathSegments: string[];
  data: Record<string, unknown>;
  storyMd: string;
};

/**
 * 文件名形如 "2023-07-22-dolomites.mdx" 时，剥掉前缀日期返回 "dolomites"。
 * 没有日期前缀的文件名（如 "dolomites.mdx"）原样返回。
 * 这样文件系统按时间倒序排列方便查找，URL slug 仍保持简洁稳定。
 */
function stripDatePrefix(name: string): string {
  return name.replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

/**
 * 递归扫描某个目录下的所有 .md/.mdx，返回每个文件的 frontmatter + 正文 + 路径段。
 * Server Component 调用；构建时静态执行，运行时不读盘。
 */
function readAllMdx(rootDir: string): WorkRaw[] {
  if (!fs.existsSync(rootDir)) return [];
  const out: WorkRaw[] = [];
  const walk = (dir: string, segments: string[]) => {
    for (const name of fs.readdirSync(dir)) {
      // 跳过 .DS_Store、隐藏文件、Obsidian 的 .obsidian/ 等
      if (name.startsWith(".")) continue;
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full, [...segments, name]);
      } else if (name.endsWith(".md") || name.endsWith(".mdx")) {
        const baseName = name.replace(/\.mdx?$/, "");
        const slug = stripDatePrefix(baseName);
        const raw = fs.readFileSync(full, "utf8");
        const { data, content } = matter(raw);
        out.push({ slug, pathSegments: segments, data, storyMd: content });
      }
    }
  };
  walk(rootDir, []);
  return out;
}

export function readAllWorksMdx(): WorkRaw[] {
  return readAllMdx(WORKS_DIR);
}

/** 胶片卷:content/film 下每卷一个 MDX,series=胶片,album 指向 OSS film/ 前缀 */
export function readAllFilmMdx(): WorkRaw[] {
  return readAllMdx(FILM_DIR);
}

export function readAllJournalMdx(): WorkRaw[] {
  return readAllMdx(JOURNAL_DIR);
}

export function readAllReadingMdx(): WorkRaw[] {
  return readAllMdx(READING_DIR);
}
