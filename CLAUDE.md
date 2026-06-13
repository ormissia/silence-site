# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

个人摄影作品展示网站。视觉定位：**杂志感 / 大字号衬线体**——排版优先于花哨动效，让作品本身说话。

页面模块：
- 首页 Hero + 精选作品
- 作品集 Gallery（按系列/分类）
- 作品详情页（大图 + 拍摄故事 / EXIF）
- 关于我 + 联系方式

## 当前状态

**仓库尚未初始化** —— 仅存在本 CLAUDE.md。下方"技术栈"与"目录约定"是已经达成的设计决定，待执行 `create-next-app` 后落地。在脚手架生成前，不要假定 `package.json`、`next.config.*`、`app/` 等已存在。

## 技术栈

- **框架**：Next.js（App Router，TypeScript）
- **样式**：Tailwind CSS
- **图片**：阿里云 OSS 托管原图，前端通过 `next/image` 加载，缩略图/WebP 通过 OSS 图片处理参数（`?x-oss-process=image/resize,...` / `format,webp`）实时生成
- **作品元数据**：项目内静态清单（JSON 或 MDX），不接 CMS、不在构建时调 OSS 列举接口
- **字体**：通过 `next/font` 加载衬线字体（如 Playfair Display / Cormorant Garamond）承载"杂志感"

## 架构要点

### 数据流：静态清单 + OSS 直链

作品的"目录"和"图片本体"分离：

```
项目仓库 (元数据)              阿里云 OSS (图片资源)
─────────────────             ─────────────────────
content/works/*.mdx    ──→    https://<bucket>.<region>.aliyuncs.com/works/<slug>/<file>.jpg
  - title, series                                   │
  - cover (OSS key)                                 │
  - photos[] (OSS keys)        next/image src ──────┘
  - exif, story
```

- 每个作品/系列 = 一个 MDX 或 JSON 文件，文件名即 slug
- 文件中只保存 OSS 的 **相对 key**（如 `works/lisbon-2024/01.jpg`），由统一的 `lib/oss.ts` 拼成完整 URL，避免域名/region 散落各处
- 同一函数负责附加图片处理参数，例如 `ossUrl(key, { w: 1600, format: 'webp' })`
- 路由：`app/works/[slug]/page.tsx` 读取对应清单文件 → 静态生成

### 图片管线

- **必须经过 `next/image`**，禁止裸 `<img>`，否则 LCP 和带宽会失控
- `next.config.js` 的 `images.remotePatterns` 要预先放开 OSS 域名
- 详情页大图、Gallery 缩略图、Hero 背景使用不同的 OSS 处理参数预设，集中在 `lib/oss.ts` 里命名（如 `presets.hero` / `presets.gridThumb` / `presets.detail`），避免散落字面量

### 设计实现注意

- 杂志感来自**字号反差 + 留白 + 网格**，不是动效。新增组件先确认排版层级，再考虑加交互
- Tailwind 配置中应当扩展一套语义化字号 token（如 `text-display`, `text-headline`, `text-deck`, `text-body`），不要在 JSX 里直接写 `text-[72px]`

### 字体使用规则（仅约束页面/组件渲染层）

**适用范围**：`app/**/*.tsx`、`components/**/*.tsx` 里直接写在 JSX className 上的字体类。
**不适用**：`content/**/*.mdx` 里的 frontmatter 与正文（那是数据，由组件决定字体）；任何 markdown 渲染器内部的 typography 默认。

规则：

- **全站默认走 `font-sans`**（Inter 西文 + 系统中文 PingFang SC 黑体），跟左上角 SILENCE 视觉一致——几何黑体，电影暗调感
- 中英文都用 `font-sans`，**不要混用 `font-serif`**
- `font-serif`（Playfair Display 衬线）当前**不在设计语言里**——配置保留是为了将来需要"复古杂志感"区块时再用，新代码里不要默认用它

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

## 命令（待 `create-next-app` 后生效）

脚手架尚未生成，以下为预期命令；执行前请确认 `package.json` 已存在：

```bash
pnpm dev          # 本地开发
pnpm build        # 生产构建
pnpm start        # 启动构建产物
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
```

未确定包管理器时，**先问老公**用 npm / pnpm / yarn，再写入 `packageManager` 字段，避免 lockfile 互踩。

## 目录约定（落地时遵循）

```
app/                      # App Router 路由
  page.tsx                # 首页 Hero + 精选
  works/
    page.tsx              # Gallery 列表
    [slug]/page.tsx       # 作品详情
  about/page.tsx
content/
  works/                  # 作品元数据 (MDX 或 JSON)，文件名 = slug
  series.json             # 系列/分类索引
lib/
  oss.ts                  # OSS URL 拼装 + 图片处理预设（唯一出口）
  works.ts                # 读取 content/works，提供 listWorks / getWork
components/
  gallery/                # Gallery 网格、瀑布流
  work/                   # 详情页大图、EXIF、故事块
  layout/                 # Header / Footer / 排版容器
public/
  placeholders/           # 占位图（开发期）
```

## 工作流约定

- **占位图先行**：在 OSS 资源就位前，作品元数据中的 `cover` 可以指向 `/placeholders/...` 或 picsum，框架先跑起来；切真实 OSS 时只改 `lib/oss.ts` 的 base 与清单中的 key
- **新增页面前**：先在 `lib/works.ts` 看现有数据接口，复用 `listWorks` / `getWork`，不要重新读文件
- **OSS 域名 / AccessKey** 等通过 `.env.local` 注入，绝不写进仓库；`.env.example` 仅放占位
- 列举 OSS 内容（如果将来需要）走构建脚本，不放进运行时
