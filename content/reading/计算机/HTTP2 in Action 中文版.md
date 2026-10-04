---
doc_type: weread-highlights-reviews
bookId: "32517945"
reviewCount: 0
noteCount: 3
author: Barry Pollard
cover: https://cdn.weread.qq.com/weread/cover/50/YueWen_32517945/t6_YueWen_32517945.jpg
progress: 61%
readingTime: 7小时37分钟
readingDate: 2025-05-06
isbn: 9787121386718
category: 计算机 理论知识
title: HTTP/2 in Action 中文版
rating: 72.2%
readProgress: 61
readingTimestamp: 27460
lastReadDate: 2025-05-16
lastReadTimestamp:
tags:
  - 读书笔记
  - 计算机
  - 理论知识
  - 在读
totalWords: 239680

---

# HTTP/2 in Action 中文版

# 元数据
> [!abstract] HTTP/2 in Action 中文版
> - ![ HTTP/2 in Action 中文版|200](https://cdn.weread.qq.com/weread/cover/50/YueWen_32517945/t6_YueWen_32517945.jpg)
> - 书名： HTTP/2 in Action 中文版
> - 作者： Barry Pollard
> - 简介： 本书以易于理解、方便上手的方式，使用贴近用户的实例来解释 HTTP/2 协议。本书首先介绍为什么要升级到 HTTP/2 以及升级的方法 ；然后逐步深入，详细解释了 HTTP/2 协议本身及其对Web 开发的影响 ；之后介绍了部分高级内容，如流状态、HPACK 等 ；最后探讨了 HTTP 的未来。本书对于 Web 开发者和运维工程师来说是一本很有价值的参考书。
> - 出版时间 2020-07-01 00:00:00
> - ISBN： 9787121386718
> - 分类： 计算机-理论知识
> - 出版社： 电子工业出版社



---

# 高亮划线

#### 2.2 解决HTTP/1.1性能问题的方案

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 打开多个连接是解决HTTP/1.1阻塞问题的最简单方法，这样可以同时开启多个HTTP请求。
> ^19-1345-1390

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 大多数浏览器可以为每个域名打开6个连接。
> ^19-1441-1461

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 使用多个HTTP连接听起来不错，但它也有缺点。当开启多个HTTP连接时，客户端和服务器都有额外的开销：打开TCP连接需要时间，维护连接需要更多的内存和CPU资源。
> ^19-2220-2301

