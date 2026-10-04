import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { assertValidContent, assertValidDateLiterals } from "./content/validation";
import type { ContentKind, ContentSource } from "./content/types";

const WORKS_DIR = path.join(process.cwd(), "content/works");
const JOURNAL_DIR = path.join(process.cwd(), "content/journal");
const READING_DIR = path.join(process.cwd(), "content/reading");

export type WorkRaw = ContentSource;

/**
 * 递归扫描某个目录下的所有 .md/.mdx，返回每个文件的 frontmatter + 正文 + 路径段。
 * 每个内容模块持有自己的进程快照；构建 worker 或服务端冷启动首次读取。
 */
function readAllMdx(rootDir: string, kind: ContentKind): WorkRaw[] {
  if (!fs.existsSync(rootDir)) throw new Error(`Missing content directory: ${path.relative(process.cwd(), rootDir)}`);
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
        const sourcePath = path.relative(process.cwd(), full);
        try {
          const parsed = matter(raw);
          const { data, content } = parsed;
          if (!data || typeof data !== "object" || Array.isArray(data) || data instanceof Date) throw new Error("frontmatter must be an object");
          const source = { sourcePath, fileName, pathSegments: segments, data, storyMd: content };
          assertValidDateLiterals(kind, source, parsed.matter);
          out.push(source);
        } catch (error) {
          throw new Error(`${sourcePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  };
  walk(rootDir, []);
  assertValidContent(kind, out);
  return out;
}

export function readAllWorksMdx(): WorkRaw[] {
  return readAllMdx(WORKS_DIR, "works");
}

export function readAllJournalMdx(): WorkRaw[] {
  return readAllMdx(JOURNAL_DIR, "journal");
}

export function readAllReadingMdx(): WorkRaw[] {
  return readAllMdx(READING_DIR, "reading");
}
