# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

个人摄影作品 + 阅读 + 随笔的展示站点。视觉定位：**电影暗调 + 几何黑体**——字号反差、留白、网格承担"杂志感"，作品本身说话，不堆动效。

页面模块（已落地）：
- **首页**（`/`）：Hero + 精选作品 + 3D 书球（首页今日一句 Highlight）
- **Works**（`/works`，`/works/[slug]`）：作品集列表（按系列 tab）+ 详情页（大图 + EXIF + 故事）
- **Journal**（`/journal`，`/journal/[slug]`）：随笔，按 `life` / `tech` 分类
- **Reading**（`/reading`，`/reading/[slug]`）：微信读书导出的笔记 + 划线，按一级分类聚合
- **About**（`/about`）：关于我 + 联系方式

## 技术栈

- **框架**：Next.js 14.2.5（App Router，TypeScript，React 18.3）
- **样式**：Tailwind 3.4（`tailwind.config.ts` 扩展了语义化字号 token：`display` / `headline` / `lede` / `body` / `deck`）
- **字体**：`next/font` 加载 Inter（西文）+ Noto Sans SC 100（中文 hairline）+ Playfair Display（衬线，备用、当前设计语言不使用）
- **图片**：阿里云 OSS 托管原图；前端用 `next/image` 但 **关闭** Next 优化器（`images.unoptimized=true`），由 OSS 的 `?x-oss-process=image/resize,...` 实时生成缩略/WebP
- **内容**：MDX/MD + frontmatter（`gray-matter` 解析，`marked` 渲染），不接 CMS、不在运行时调 OSS
- **包管理**：npm（`package-lock.json`）；改依赖直接走 `npm`，别引入 pnpm/yarn 互踩

## 架构要点

### 数据流：静态清单 + OSS 直链 + 构建期 manifest

三个内容模块（works / journal / reading）都走同一套：MDX/MD 提供"目录"，OSS 提供"图片本体"。

```
项目仓库 (元数据)                       阿里云 OSS (图片资源)
─────────────────                      ─────────────────────
content/works/<series>/*.mdx    ──→    https://<bucket>.oss-cn-beijing.aliyuncs.com/works/<series>/<album>/<file>.jpg
content/journal/<category>/*.mdx ──→   https://<bucket>.oss-cn-beijing.aliyuncs.com/journal/<category>/<file>.jpg
content/reading/<分类>/*.md      (cover 可外链或 OSS key)
   - frontmatter（title / cover / album …）
   - 正文（故事 / 笔记 / 划线 📌）       next/image src ──── lib/oss.ts:buildSrc ──┘
```

- **MDX 路径段即一级分类**：`content/works/landscape/*.mdx` → series=风光；`content/journal/life/*.mdx` → category=life。这是兜底，frontmatter 显式字段优先（见 `lib/works.ts:seriesFromPath`、`lib/journal.ts:resolveCategory`、`lib/reading.ts:resolveCategory`）。
- **OSS key 由 `lib/oss.ts` 唯一拼装**，域名/region 不允许散落他处。
- **Works 的相册图片**通过构建期 ListObjectsV2 列举（`lib/oss-list.ts`），结果落到 `content/.album-manifest.json`（不入 git），运行时只读缓存——避免运行时调 OSS。配合 `lib/image-meta.ts` 用 `image/info` 接口探测真实像素宽高，注入到 `Photo.width/height`，供 Justified Layout 排版。
- **MDX 读取入口集中在 `lib/mdx.ts`**：`readAllWorksMdx` / `readAllJournalMdx` / `readAllReadingMdx`，文件名不参与 URL slug，URL 由 frontmatter `slug` 字段决定（缺省时才回退到文件名）。

### 图片管线

- **必须用 `next/image`**，禁止裸 `<img>`。但 `next.config.js` 设了 `images.unoptimized=true`——OSS 自带处理在做同样的事，Next 优化器再包一层只会触发防盗链 403。
- `next.config.js` 的 `images.remotePatterns` 已放开 `ormissia-album.oss-cn-beijing.aliyuncs.com`。换 bucket 要同步改。
- 图片处理预设集中在 `lib/oss.ts:PRESET_DIM`：`hero` / `gridThumb` / `detail` / `portrait`。**不要在 JSX 里写 `image/resize,...` 字面量**，新预设加到 `PRESET_DIM` 里。
- **未配置 `NEXT_PUBLIC_OSS_BASE_URL` 时自动退到 picsum**（按 key 做 hash 出稳定占位图），本地开发不依赖真实 OSS。

### 内容模块的封面字段约定

`frontmatter.cover` 在 works / journal / reading 都通用，识别规则统一在各自的 lib 里：

- **`http(s)://...` 开头** → 原样透传（外链封面）
- **包含 `/` 的完整 OSS key**（如 `works/film/0001-120-RVP100-1/23670001.jpg`）→ 原样透传，可跨目录复用图片
- **纯文件名** → 按 MDX 所在目录自动拼前缀（journal 拼 `journal/<category>/<file>`，works 借助 `album` 字段）

`lib/oss.ts:buildSrc` 在最外层兜底外链 / 本地 `/public` 路径直通，调用方不用判断。

### 字体使用规则（仅约束页面/组件渲染层）

**适用范围**：`app/**/*.tsx`、`components/**/*.tsx` 里直接写在 JSX className 上的字体类。
**不适用**：`content/**/*.mdx` 里的 frontmatter 与正文（那是数据，由组件决定字体）；任何 markdown 渲染器内部的 typography 默认。

规则：

- **全站默认走 `font-sans`**（Inter 西文 + 系统中文 PingFang SC 黑体），跟左上角 SILENCE 视觉一致——几何黑体，电影暗调感
- 中英文都用 `font-sans`，**不要混用 `font-serif`**
- `font-serif`（Playfair Display 衬线）当前**不在设计语言里**——配置保留是为了将来需要"复古杂志感"区块时再用，新代码里不要默认用它
- **超大标题**可以用 `font-hairline`（Noto Sans SC 100），给"寂静无声"这种主视觉用，比 PingFang Ultralight 还纤细

**为什么**：
- 整站调性是电影暗调，几何黑体跟暗调更搭；衬线带来的"杂志感"跟当前主调冲突
- Inter 不带中文字形 → 中文回退到系统黑体（PingFang/微软雅黑）→ 中英排版都干净

**反例**：
```tsx
// ❌ 用 font-serif，跟全站调性不搭
<h1 className="font-serif">The Quiet Hours</h1>

// ✅ 默认 font-sans
<h1 className="font-sans">The Quiet Hours</h1>
<p className="font-sans">这是一段中文</p>

// ✅ body 已经设了 font-sans，纯文本块可以省略字体类
<p>这是一段中文</p>
```

### 设计实现注意

- 杂志感来自**字号反差 + 留白 + 网格**，不是动效。新增组件先确认排版层级，再考虑加交互。
- Tailwind 的语义化字号 token（`text-display` / `text-headline` / `text-lede` / `text-body` / `text-deck`）已经定义，不要在 JSX 里直接写 `text-[72px]` 这种字面量。
- 颜色 token 也是语义化命名：`paper`（深邃黑）/ `ink`（暖白）/ `muted` / `rule` / `accent` / `ember`。

## 命令

```bash
npm run dev          # 本地开发
npm run build        # 生产构建（会触发 OSS 列举 + 像素探测，首次较慢，之后走 .album-manifest.json）
npm run start        # 启动构建产物
npm run lint         # next lint
npm run typecheck    # tsc --noEmit
```

## 目录约定（现状）

```
app/                      # App Router 路由
  page.tsx                # 首页 Hero + 精选 + 今日一句 + 书球
  works/
    page.tsx              # 作品列表（带 series tab）
    [slug]/page.tsx       # 作品详情
    loading.tsx
  journal/
    page.tsx              # 随笔列表
    [slug]/page.tsx
  reading/
    page.tsx              # 书架
    [slug]/page.tsx
  about/page.tsx
  loading.tsx / not-found.tsx / globals.css
  layout.tsx              # 加载字体 + Header/Footer + RouteProgress
content/
  works/<series>/*.mdx    # series ∈ landscape/portrait/snapshots/film
  journal/<category>/*.mdx# category ∈ life/tech
  reading/<分类>/*.md      # 微信读书导出，分类目录中文（哲学宗教/历史/...）
  .album-manifest.json    # 构建期 OSS 列举缓存（不入 git）
lib/
  oss.ts                  # OSS URL 拼装 + 图片处理预设（唯一出口）
  oss-list.ts             # 构建期 OSS ListObjectsV2 列举 + manifest 缓存
  image-meta.ts           # 构建期 image/info 探测真实像素 W/H + 缓存
  concurrency.ts          # mapWithConcurrency / withRetry
  mdx.ts                  # 递归扫描 content/，返回 frontmatter + storyMd
  markdown.ts             # marked 渲染配置
  works.ts                # listWorks / getWork / listSeries / listFeatured ...
  journal.ts              # listJournal / getJournalEntry
  reading.ts              # listReading / getReadingEntry / getDailyHighlight ...
  categories.ts           # 作品分类常量（风光/人像/日常/胶片）+ tab slug 映射
  journal-categories.ts   # 随笔分类常量（life/tech）
components/
  home/                   # 首页板块（selected-works / today-highlight / book-sphere / editor-note）
  work/                   # 作品列表 + 详情大图（works-gallery / plates-grid）
  journal/                # 随笔列表
  reading/                # 书架
  layout/                 # SiteHeader / Footer / CategoryTabs / RouteProgress / SecondaryPageHeader / NavLink
  hero.tsx / cinema-hero.tsx / work-card.tsx / camera-spec.ts
public/                   # 静态资源、占位图
```

## 工作流约定

- **新增作品/随笔/书**：在对应 `content/<模块>/<分类>/*.mdx` 加文件，frontmatter 走现有字段约定（参考同目录其他文件），不用改代码。
- **新增页面前**：先看 `lib/works.ts` / `lib/journal.ts` / `lib/reading.ts` 的导出接口，复用 `listXxx` / `getXxx`，不要绕过去重新读文件。
- **OSS 列举失败**：`content/.album-manifest.json` 里命中失败的 prefix 不会落缓存，下次 `npm run build` 自动重试。本地 demo 模式（没设 `NEXT_PUBLIC_OSS_BASE_URL`）走 picsum 占位，不污染缓存。
- **OSS 域名 / AccessKey** 通过 `.env.local` 注入，绝不写进仓库；`.env.example` 仅放占位字面量（`<bucket>...` 这种被代码识别为未配置）。
- **跨目录引用图片**：`cover` / `photos[].key` 写完整 OSS key（含 `/`）即可，`lib/oss.ts:buildSrc` 会直接透传，不会被当成相对路径处理。
