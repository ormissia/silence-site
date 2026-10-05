# silence-site

> SILENCE — Personal site by Song. Photographs, reading notes, journal. 个人站：摄影、读书笔记、随笔。Next.js + Tailwind.

> 设计规范详见 [DESIGN.md](./DESIGN.md)（字体、色彩、组件风格）

## 内容数据边界与检查

列表使用 `listReadingSummaries`、`listWorkSummaries`、`listJournalSummaries`；首页精选使用 `listFeaturedSummaries`。这些接口仅返回展示字段。详情继续使用原有 `getXxx` 接口，旧的完整 `listXxx` 接口保留兼容。

客户端类型位于 `lib/reading/types.ts`、`lib/works/types.ts`、`lib/journal/types.ts`。内容读取、Markdown 渲染及 OSS 资源读取模块通过 `server-only` 限制为服务端使用。

Reading 和 Journal 在构建 worker 或服务端冷启动时各扫描一次 Markdown，持有进程内的原文、元数据和 slug 索引。摘要查询不渲染正文，详情和阅读分段在首次查询时渲染并缓存；书摘复用同一份阅读原文。首页使用 `pickSphereBookSummaries`，保留每次请求随机选书，UTC 每日书摘规则不变。旧完整接口仍可使用，但会按需渲染其返回对象的正文。

进程内快照不提供热刷新；修改内容后需要重新构建并部署，本地开发必要时重启服务。

每次 `npm run build` 都重新列举 OSS 相册并探测图片尺寸，包括同 key 替换的图片。两个资源产物仍位于 `content/.album-manifest.json` 和 `content/.image-meta.json`，包含格式版本、OSS 来源、构建标识和生成时间，不入 Git。多个构建 worker 通过锁共用本次结果，产物以临时文件加原子替换写入。

生产运行时只读已打包的资源产物，不访问 OSS 清单/尺寸接口，也不写盘；产物缺失、损坏、来源不符或与编译进应用的构建标识不符时明确失败；即使两份旧清单的标识彼此相同，也不能用于新部署。构建期对瞬时网络错误、408、429 和 5xx 重试，单次请求限时 10 秒；最终失败会停止启动剩余任务并阻止构建，重新构建会重新准备。成功列举到空相册仍按原规则隐藏。开发可补齐当前缓存；未配置 OSS 时保留原有演示图片和尺寸，不请求、不污染真实产物。

`next.config.js` 显式追踪两份资源产物。Vercel 使用正常的 `npm run build`，不需要额外脚本或构建命令；修改 OSS 图片后重新构建部署即可。

## 相册与导航交互边界

`PlatesGrid` 管理普通/胶片相册布局、当前照片、循环切换和打开期间的滚动锁定；`PhotoLightbox` 保留灯箱视图；`usePhotoViewport` 管理缩放、平移、鼠标、触屏、键盘和事件清理。拆分保留原有 DOM、样式、手势阈值与图片预设。

`NavProgressLink` 先执行调用方点击回调，再判断是否需要进度反馈。当前页面、仅锚点变化、被取消的点击、修饰键、新窗口和外链不启动进度；同路径查询参数改变仍启动。实际跳转、分类筛选和返回位置继续沿用现有行为。

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
