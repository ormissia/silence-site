import { marked } from "marked";

/**
 * 站点统一的 Markdown 渲染管道。
 *
 * 输入：原始 markdown（可能来自 Obsidian / 微信读书导出，可能丢了 `>` 前缀）
 * 输出：HTML 字符串（server 端渲染，客户端 dangerouslySetInnerHTML 直接用）
 *
 * 在标准 GFM 之上做了几件事：
 * 1. 剥掉行内 `<span style="color:..."> </span>` 颜色标记（站点暗调下显示不出来还乱样式）
 * 2. 修复"丢失 `>` 前缀的 callout"：`[!Cite]+ Highlight 📌 ...` 这种粘贴破损也能识别
 * 3. 删 Obsidian 块 ID（`^3-6414-6482` 公开页面用不到）
 * 4. 把 Obsidian callout（`> [!type]+ ...`）转成 admonition `<div class="md-callout md-callout-{type}">`
 * 5. 关闭 marked 的 mangle/headerIds 等老选项，启用 GFM 表格 / 删除线 / checkbox
 */

marked.setOptions({ gfm: true, breaks: false });

/**
 * 剥掉 inline `<span style="...">text</span>`，只留文字。
 * 微信读书 / Obsidian 复制粘贴常带这种着色标记。
 */
function stripInlineSpans(md: string): string {
  return md.replace(/<span\s[^>]*>([\s\S]*?)<\/span>/gi, "$1");
}

/**
 * 微信读书 / Obsidian 复制粘贴破损归一化。
 *
 * 处理三种常见破损（在丢失 `>` 前缀的基础上还会出现）：
 *
 * 1) callout 头与内容粘到一行：
 *    `[!Cite]+ Highlight 📌 内容...`
 *    → 拆成两行
 *      `> [!Cite]+ Highlight`
 *      `> 📌 内容...`
 *
 * 2) 没有 `[!Cite]+` 标记，只剩 `Highlight` 单独一行 + 后面 `📌 内容`：
 *      Highlight
 *
 *      📌 内容
 *    → 补成
 *      `> [!cite]+ Highlight`
 *      `> 📌 内容`
 *
 * 3) 行首 `📌` 没 `>` 前缀：兜底加上
 *
 * 注意顺序：必须在 fixOrphanCallouts 之前跑，否则后者会先把孤立的 [!Cite]+
 * 行补成 callout 头，把后面同一行的 📌 内容当成 title 文本。
 */
function normalizeWereadHighlights(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 情况 1：一行内同时出现 [!type]+ 和 📌
    // 用懒匹配 + 显式 📌 锚点，确保 callout 头部分不吃到 📌
    const inlined = /^>?\s*\[!(\w+)\][+-]?\s*([^📌\n]*?)\s*(📌[\s\S]*)$/.exec(line);
    if (inlined) {
      const type = inlined[1];
      const titleHint = inlined[2].trim() || "Highlight";
      const content = inlined[3];
      out.push(`> [!${type}]+ ${titleHint}`);
      out.push(`> ${content}`);
      continue;
    }

    // 情况 2：单独一行 Highlight（不带 `[!`），后面紧跟 📌
    if (/^(Highlight|HIGHLIGHT|高亮)\s*$/.test(line.trim())) {
      // 看下一个非空行是否以 📌 开头
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j < lines.length && /^>?\s*📌/.test(lines[j].trim())) {
        out.push(`> [!cite]+ Highlight`);
        // 跳过中间空行
        i = j - 1;
        continue;
      }
    }

    // 情况 3：行首 📌 没有 `>`
    if (/^📌/.test(line)) {
      out.push(`> ${line}`);
      continue;
    }

    out.push(line);
  }
  return out.join("\n");
}

/**
 * 修复"丢了 `>` 前缀的 callout"。
 *
 * 触发条件：行首是 `[!type]+ ...` 或 `[!type] ...`（无 `>`）。
 * 修法：给该行补上 `>`，再把紧随其后的"已经是 callout 内容"的行也补 `>`，
 * 直到遇到空行 / 标题行 / 下一个 callout 头。
 *
 * 难点：粘贴破损时，原来的多行 callout 可能被压成一行了，比如
 *   "[!Cite]+ Highlight 📌 内容"
 * 这种情况已经能被识别为 callout 头，标题部分会包含 "Highlight 📌 内容"，
 * 不影响渲染——交给后面 transformCallouts。
 */
function fixOrphanCallouts(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inOrphan = false;
  for (const line of lines) {
    const isHeadWithBq = /^>\s*\[!\w+\]/.test(line);
    const isHeadOrphan = /^\[!\w+\][+-]?\s/.test(line);

    if (isHeadOrphan) {
      out.push("> " + line);
      inOrphan = true;
      continue;
    }

    if (isHeadWithBq) {
      out.push(line);
      inOrphan = false;
      continue;
    }

    // 在 orphan callout 内：空行结束；标题行结束；引用行已自带 `>`，原样保留
    if (inOrphan) {
      if (line.trim() === "" || /^#/.test(line) || /^>/.test(line) || /^---/.test(line)) {
        inOrphan = false;
        out.push(line);
        continue;
      }
      // 接上 callout 内容
      out.push("> " + line);
      continue;
    }

    out.push(line);
  }
  return out.join("\n");
}

/**
 * Obsidian callout 语法预处理。
 *
 * 形如：
 *   > [!abstract] 标题
 *   > 内容
 *   > 更多内容
 *
 * 的整段 blockquote，转成：
 *   <div class="md-callout md-callout-abstract">
 *     <p class="md-callout-title">标题</p>
 *     ... 后续内容当 markdown 继续渲染 ...
 *   </div>
 */
function transformCallouts(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const head = /^>\s*\[!(\w+)\][+-]?\s*(.*)$/.exec(line);
    if (!head) {
      out.push(line);
      i++;
      continue;
    }
    const type = head[1].toLowerCase();
    const title = head[2].trim();
    const content: string[] = [];
    i++;
    while (i < lines.length && /^>\s?/.test(lines[i])) {
      content.push(lines[i].replace(/^>\s?/, ""));
      i++;
    }
    const innerHtml = marked.parse(content.join("\n"), { async: false }) as string;
    const titleHtml = title
      ? `<p class="md-callout-title">${escapeHtml(title)}</p>`
      : "";
    out.push(
      `<div class="md-callout md-callout-${type}">${titleHtml}${innerHtml}</div>`
    );
  }
  return out.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 删 Obsidian 块 ID（行尾 `^xxx-xxx-xxx` 这种锚点）。
 * 也会删独占一行的 `^xxx-xxx-xxx`。
 */
function stripBlockIds(md: string): string {
  return md
    .replace(/\s*\^[\w\d-]+\s*$/gm, "") // 行尾块 ID
    .replace(/^\^[\w\d-]+\s*$/gm, ""); // 独占一行的块 ID
}

/**
 * Markdown → HTML 主入口。Server-side 调用，结果可以缓存到 frontmatter 解析后的对象上。
 */
export function renderMarkdown(md: string): string {
  const noSpan = stripInlineSpans(md);
  const normalized = normalizeWereadHighlights(noSpan);
  const cleaned = stripBlockIds(normalized);
  const fixed = fixOrphanCallouts(cleaned);
  const withCallouts = transformCallouts(fixed);
  return marked.parse(withCallouts, { async: false }) as string;
}
