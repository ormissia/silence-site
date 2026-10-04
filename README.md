# silence-site

> SILENCE — Personal site by Song. Photographs, reading notes, journal. 个人站：摄影、读书笔记、随笔。Next.js + Tailwind.

> 设计规范详见 [DESIGN.md](./DESIGN.md)（字体、色彩、组件风格）

## 内容数据边界与检查

列表使用 `listReadingSummaries`、`listWorkSummaries`、`listJournalSummaries`；首页精选使用 `listFeaturedSummaries`。这些接口仅返回展示字段。详情继续使用原有 `getXxx` 接口，旧的完整 `listXxx` 接口保留兼容。

客户端类型位于 `lib/reading/types.ts`、`lib/works/types.ts`、`lib/journal/types.ts`。内容读取、Markdown 渲染及 OSS 资源读取模块通过 `server-only` 限制为服务端使用；当前完整内容准备流程仍沿用原实现，资源刷新与运行边界另行迁移。

使用 npm 执行检查：

```bash
npm run lint
npm run typecheck
npm run build
npm run check:client-data
```

`check:client-data` 读取生产构建的列表 RSC，确认正文、EXIF 和相册详情没有进入客户端数据；需要先完成 `build`，开发模式的 `.next` 产物不适用于此检查。输出大小为未压缩 RSC 字节数。

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
