---
doc_type: weread-highlights-reviews
bookId: "25916509"
reviewCount: 0
noteCount: 5
author: 李华峰 陈虹
cover: https://cdn.weread.qq.com/weread/cover/51/YueWen_25916509/t6_YueWen_25916509.jpg
progress: 88%
readingTime: 1小时51分钟
readingDate: 2024-01-14
finishedDate: 2024-03-07
isbn: 9787115505224
category: 计算机 理论知识
title: Wireshark网络分析从入门到实践
rating: 75.9%
readProgress: 88
readingTimestamp: 6674
lastReadDate: 2024-03-04
lastReadTimestamp: 1709822236
tags:
  - 读书笔记
  - 计算机
  - 理论知识
  - 读完
totalWords: 138756

---

# Wireshark网络分析从入门到实践

# 元数据
> [!abstract] Wireshark网络分析从入门到实践
> - ![ Wireshark网络分析从入门到实践|200](https://cdn.weread.qq.com/weread/cover/51/YueWen_25916509/t6_YueWen_25916509.jpg)
> - 书名： Wireshark网络分析从入门到实践
> - 作者： 李华峰 陈虹
> - 简介： Wireshark是一款开源网络协议分析器，能够在多种平台（例如Windows、Linux和Mac）上抓取和分析网络包。本书将通过图文并茂的形式来帮助读者了解并掌握Wireshark的使用技巧。本书由网络安全领域资深的高校教师编写完成，集合了丰富的案例，并配合了简洁易懂的讲解方式。全书共分17章，从Wireshark的下载和安装开始讲解，陆续介绍了数据包的过滤机制、捕获文件的打开与保存、虚拟网络环境的构建、常见网络设备、Wireshark的部署方式、网络延迟的原因、网络故障的原因，并介绍了多种常见的攻击方式及应对策略，除此之外，本书还讲解了如何扩展Wireshark的功能以及Wireshark中的辅助工具。本书实用性较强，适合网络安全渗透测试人员、运维工程师、网络管理员、计算机相关专业的学生以及各类安全从业者参考阅读。
> - 出版时间 2019-04-01 00:00:00
> - ISBN： 9787115505224
> - 分类： 计算机-理论知识
> - 出版社： 人民邮电出版社



---

# 高亮划线

### 2.1 伯克利包过滤

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 伯克利包过滤中的限定符有下面3种。
>
>•type：这种限定符表示指代的对象，例如IP地址、子网或者端口等。常见的有host（用来表示主机名和IP地址）、net（用来表示子网）、port（用来表示端口）。如果没有指定的话，就默认为host。
>
>•dir：这种限定符表示数据包传输的方向，常见的有src（源地址）和dst（目的地址）。如果没有指定的话，默认为“srcordst”。例如“192.168.1.1”就表示无论源地址或者目的地址为192.168.1.1的都使得这个语句为真。
>
>•proto：这种限定符表示与数据包匹配的协议类型，常见的就是ether、ip、tcp、arp这些协议。
> ^18-901-1278
### 10.1 中间人攻击的相关理论

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 数据包在局域网内部是无法使用IP地址进行通信的，因为局域网中的连接设备只能识别MAC（硬件）。但是应用程序发出的数据包中往往只包含了目标的IP地址，此时就需要由ARP程序来找到数据包目的IP地址对应的MAC地址
> ^70-1133-1238
### 10.2 使用专家系统分析中间人攻击

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 如果同时出现了大量的ARP数据包，通常是由以下3种情况造成的。
>
>•有攻击者在利用ARP请求对网络主机进行扫描。
>
>•有计算机感染了ARP病毒并在破坏网络的通信。
>
>•有攻击者在利用ARP欺骗在发动中间人攻击。
> ^71-1025-1211
### 12.1 拒绝服务攻击的相关理论

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 服务器所面临的最大威胁当数拒绝服务攻击，拒绝服务攻击其实是一类攻击的合称。所有这种类型的攻击的目的都是相同的，那就是要是使受攻击的服务器系统瘫痪或服务失效，从而使合法用户无法得到相应的资源。
> ^81-421-516

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 其中SYNflooding攻击是针对TCP协议的，它的主要目的是占用目标上所有可用的连接请求。而UDPflooding攻击则是针对UDP协议的，主要目的是耗尽目标所在网络的带宽。
> ^81-762-853

