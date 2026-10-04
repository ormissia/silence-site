# silence-site

> SILENCE — Personal site by Song. Photographs, reading notes, journal. 个人站：摄影、读书笔记、随笔。Next.js + Tailwind.

> 设计规范详见 [DESIGN.md](./DESIGN.md)（字体、色彩、组件风格）

## 内容数据边界与检查

列表使用 `listReadingSummaries`、`listWorkSummaries`、`listJournalSummaries`；首页精选使用 `listFeaturedSummaries`。这些接口仅返回展示字段。详情继续使用原有 `getXxx` 接口，旧的完整 `listXxx` 接口保留兼容。

客户端类型位于 `lib/reading/types.ts`、`lib/works/types.ts`、`lib/journal/types.ts`。内容读取、Markdown 渲染及 OSS 资源读取模块通过 `server-only` 限制为服务端使用。

Reading 和 Journal 在构建 worker 或服务端冷启动时各扫描一次 Markdown，持有进程内的原文、元数据和 slug 索引。摘要查询不渲染正文，详情和阅读分段在首次查询时渲染并缓存；书摘复用同一份阅读原文。首页使用 `pickSphereBookSummaries`，保留每次请求随机选书，UTC 每日书摘规则不变。旧完整接口仍可使用，但会按需渲染其返回对象的正文。

进程内快照不提供热刷新；修改内容后需要重新构建并部署，本地开发必要时重启服务。OSS 列举与图片尺寸缓存仍沿用现有流程，刷新和严格的构建/运行职责留待后续迁移。

使用 npm 执行检查：

```bash
npm run lint
npm run typecheck
npm run build
```

内容模块在读取 Markdown 时校验 frontmatter、最终 slug 唯一性、字段类型、日期和显式照片尺寸，错误包含源文件与字段位置。缺失内容目录、重复 slug 和错误类型会明确失败。未知导出字段、null、数字 ISBN 和中文阅读时长保持兼容，不自动转换阅读日期或 ISBN。

# TODO

- [x] 跳转优化
- [x] 首页跳转按钮无法跳转
- [x] 统一二级页面的tab
- [x] works tab展示数量
- [x] works下批量去除photoCount，添加cover
- [x] md目录
- [x] journal分目录，根据目录确定category
- [x] journal 优化cover: journal/000106530022
- [x] journal 标题在首图上面，参考works
- [x] 读书笔记封面改小
- [x] 读书笔记封面 鼠标悬浮时放大且出现跟随动效
- [ ] 返回按钮
