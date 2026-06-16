import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const WORKS_DIR = path.join(process.cwd(), "content/works");
const JOURNAL_DIR = path.join(process.cwd(), "content/journal");
const READING_DIR = path.join(process.cwd(), "content/reading");

export type WorkRaw = {
  /** 裸文件名（去扩展名），不再承担任何语义——slug 由各 lib 用 frontmatter 自行决定。
   *  仅作为 frontmatter 没有显式 slug 时的兜底 hash 输入。 */
  fileName: string;
  /** 文件相对于扫描根目录的路径段（不含文件名）。
   *  例：content/reading/哲学宗教/理想国.md → ["哲学宗教"]。
   *  顶层文件为空数组。Reading / Journal / Works 都用它做"目录即一级分类"的 fallback。 */
  pathSegments: string[];
  data: Record<string, unknown>;
  storyMd: string;
};

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
        const fileName = name.replace(/\.mdx?$/, "");
        const raw = fs.readFileSync(full, "utf8");
        const { data, content } = matter(raw);
        out.push({ fileName, pathSegments: segments, data, storyMd: content });
      }
    }
  };
  walk(rootDir, []);
  return out;
}

export function readAllWorksMdx(): WorkRaw[] {
  return readAllMdx(WORKS_DIR);
}

export function readAllJournalMdx(): WorkRaw[] {
  return readAllMdx(JOURNAL_DIR);
}

export function readAllReadingMdx(): WorkRaw[] {
  return readAllMdx(READING_DIR);
}
