---
doc_type: weread-highlights-reviews
bookId: "22651844"
title: TCP-IP协议及其应用
reviewCount: 0
noteCount: 84
author: 林成浴
cover: https://cdn.weread.qq.com/weread/cover/10/YueWen_22651844/t6_YueWen_22651844.jpg
readingStatus: "4"
progress: 75%
readingTime: 11小时58分钟
readingDate: 2024-01-04
finishedDate: 2024-01-16
isbn: 9787115325228
category: 计算机 计算机综合
rating: 69.6%
readProgress: 75
readingTimestamp: 43109
lastReadDate: 2024-01-16
lastReadTimestamp: 1705372720
tags:
  - 读书笔记
  - 计算机
  - 计算机综合
  - 读完
totalWords:

---

# TCP-IP协议及其应用

# 元数据
> [!abstract] TCP-IP协议及其应用
> - ![ TCP-IP协议及其应用|200](https://cdn.weread.qq.com/weread/cover/10/YueWen_22651844/t6_YueWen_22651844.jpg)
> - 书名： TCP-IP协议及其应用
> - 作者： 林成浴
> - 简介： 本书基于网络工程和应用需求，按照从低层到高层的逻辑顺序，有针对性地讲解TCP-IP的层次结构、工作原理和协议数据单元。全书共13章，内容包括TCP-IP基础、网络接口层、IP寻址与地址解析、IP协议、ICMP协议、IP路由、TCP与UDP协议、DNS与DHCP协议、应用层协议、SNMP协议、网络安全协议，以及IPv6协议。本书内容丰富，注重系统性和实践性，对于重点协议提供协议分析操作示范，引导读者直观地探索TCP-IP。编写过程中参考了最新的RFC文档，反映TCP-IP最新的一些发展动态。本书可作为计算机网络相关专业的教材，也可作为网络管理和维护人员的参考书以及各种培训班的教材。
> - 出版时间 2013-07-01 00:00:00
> - ISBN： 9787115325228
> - 分类： 计算机-计算机综合
> - 出版社： 人民邮电出版社



---

# 高亮划线

### 1.3 TCP/IP协议簇

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 TCP/IP协议一个个堆叠起来，就像一个栈，有时又称其为协议栈。
> ^8-1442-1474

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ARP用于根据IP地址获取物理地址。RARP用于根据物理地址查找其IP地址
> ^8-2361-2398

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 TCP为主机提供可靠的面向连接的传输服务；UDP为应用层提供简单高效的无连接传输服务。
> ^8-2871-2914

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 TCP、UDP、ICMP、IGMP都要向IP传送数据，为区分要传送的数据来源于哪一种协议，在生成的IP首部中加入一个称为协议号的标识，其中协议号1标识为ICMP协议，6标识为TCP协议，17标识为UDP协议。
> ^8-4556-4660

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 一般TCP/IP网络给临时端口分配1024～5000之间的端口号，大于5000的端口号是为其他服务器预留的。
> ^8-7213-7267

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 将一个IP地址和一个端口号码合并起来，就成为插座（Socket）
> ^8-7641-7673
### 1.4 协议分析

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在网络中，数据的收发是由网卡来完成的，网卡有以下4种接收模式。
>
>·广播：能够接收发送给自己的数据帧和网络中的广播信息。
>
>·多播：只能够接收多播数据。
>
>·直接：只能够接收发送给自己的数据帧。
>
>·混杂（PromiscuousMode）：能够接收一切通过它的数据帧，而不管该数据是否是传给它的。
>
>默认情况下，网卡处于广播模式
> ^9-1109-1413

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 如图1-21所示，从低到高分别是物理层、数据链路层、网络层、传输层和应用层，例中分别以Frame（帧）、EthernetII（以太网）、InternetProtocolVersion4（IP）、TransmissionControlProtocol（TCP）和HypertextTransferProtocol（HTTP）打头。物理层呈现的是整个帧（数据包），数据链路层、网络层、传输层所呈现的是该层数据单元的首部，而应用层呈现的是报文本身。
>
>￼
>
>图1-21协议树
> ^9-11868-12325
### 2.2 MAC寻址

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在一个局域网段内可以发送的MAC帧有以下3种。
>
>·单播（Unicast）帧：目的MAC地址是单站地址，用于一对一通信，该帧发送某一指定的站点。
>
>·广播（Broadcast）帧：目的MAC地址为广播地址（全1），用于一对全体通信，该帧将发送给网段内所有站点。
>
>·多播（Multicast）帧：目的MAC地址为多播地址，用于一对多通信，该帧发送给指定的一部分站点。
> ^13-2430-2698

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 所有的网卡都至少应当能够识别单播帧和广播帧，即能够识别单播地址和广播地址。
> ^13-2727-2764

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 实际上MAC地址的有效性只限于局域网内。虽然不同设备MAC要求是唯一的，但由于每经过一个路由网段，数据包的源和目的MAC地址都要更改（当然源和目的IP地址不变），所以不同网段中存在相同的MAC地址也是可以的，只要同一网段内MAC地址不重复就行。
> ^13-3240-3362
### 2.3 以太网帧分析

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 最小的以太网帧长度为64字节。最大的以太网帧长度为1518字节。驱动程序要确保帧满足最小帧长度规范的要求，如果某个帧不能满足最小帧长度64字节的要求，那么驱动程序必须填充相应的数据字段。
> ^14-2252-2345

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 EthernetII和IEEE802.3/802.2SNAP对要传输的数据包的长度都有一个限制，其最大值分别是1500和1492字节。链路层的这个特性称作最大传输单元（MaximumTransmissionUnit,MTU）。
> ^14-2374-2493
### 3.1 IP分类地址

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 有些IP地址并不是用来标识主机的，而是具有特殊意义，如网络地址、广播地址、环回地址。
> ^19-4678-4720

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 IANA（Internet地址分配管理局）将A、B、C类地址中保留一部分作为专用地址（PrivateAddress，又译为私有地址），具体由RFC1918“AddressAllocationforPrivateInternets”规定。3类专用IP地址范围如下。
>
>·A类：10.0.0.0～10.255.255.255。
>
>·B类：172.16.0.0～172.32.255.255。
>
>·C类：192.168.0.0～192.168.255.255。
>
>这些地址是专门提供给那些没有连接到Internet的网络使用的。如果要直接连入Internet，应使用由InterNIC分配的合法IP地址，称为公用地址（PublicAddress）。使用专用地址的目的是避免与Internet上合法的IP地址冲突。
> ^19-6321-6793
### 3.2 IP子网与超网

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 A、B、C三类网络的子网掩码分别为255.0.0.0、255.255.0.0和255.255.255.0。
> ^20-896-949
### 3.4 IP地址的配置管理

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 配置IP地址一般有两种分配方式。一种是通过动态分配方式获取IP地址，计算机启动时自动向DHCP服务器申请IP地址，除了获取IP地址外，还能获得子网掩码等。另一种是分配静态地址，设置固定的IP地址。必须为不同的计算机设置不同的IP地址，同一网段的子网掩码必须相同。
> ^22-646-777
### 3.5 地址解析

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 IP地址与物理地址之间的映射称为地址解析，包括两个方面：从IP地址到物理地址的映射和从物理地址到IP地址的映射。
> ^23-644-700

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 IP地址又称为逻辑地址，逻辑地址由软件进行处理。建立逻辑地址与物理地址之间映射的方法通常有两种：静态映射和动态映射。
> ^23-808-866

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 静态映射主要采用地址映射表来实现逻辑地址与物理地址之间的映射。
> ^23-895-926

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 动态映射则是自动维护逻辑地址与物理地址之间的映射关系，利用网络协议直接从其他节点获得映射信息。
> ^23-1130-1177

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ARP用于从IP地址到物理地址的映射；RARP协议用于从物理地址到IP地址的映射
> ^23-1177-1217

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 如果目的主机与源主机位于同一子网中，目的主机收到ARP请求后就知道源主机的物理地址，而源主机收到ARP应答后就知道目的主机的物理地址，双方即可正式通信。
>
>如果目的主机与源主机不在同一子网中时，两者之间存在一台或多台路由器，由于ARP采用的是物理网络中的广播，IP路由器（位于网络层）不会对该广播进行转发，因而就不能直接用ARP确定远程网络中目的主机的物理地址，而且也没有必要知道该物理地址。为此先将IP数据报发送给路由器，然后由路由器进行转发，IP只需要利用ARP确定路由器的物理地址，路由器将逐级转发数据报直至目的主机，整个过程如图3-16所示。
> ^23-3638-3940

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ARP介于网络层与网络接口层之间，它所传送的数据称为ARP报文。
> ^23-4450-4482

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ARP报文较短，仅有28字节，后面必须增加18个字节的填充内容（PAD），以达到以太网最小帧长度要求
> ^23-4618-4668

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在ARP应答中，分为两种情况：如果发送方和目标位于同一子网，该字段为所需IP主机的硬件地址；如果发送方和目标位于不同子网，该字段为抵达目标的路径中下一个路由器的硬件地址。
> ^23-6769-6854
### 4.1 IP协议概述

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 nternetProtocol简称IP，又译为网际协议或互联网协议，是用在TCP/IP协议簇中的网络层协议。RFC791“INTERNETPROTOCOL（Internet协议）”是IP协议的正式规范文件。
> ^26-603-709

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 IP层只负责数据的路由和传输，在源节点与目的节点之间传送数据报，但并不处理数据内容。
> ^26-1335-1377

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 IP是一个无连接的、不可靠的、点对点的协议，只能尽力（BestEffort）传送数据，不能保证数据的到达
> ^26-2635-2688
### 4.3 数据报分片与重组

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 为了保证唯一性，IP协议使用一个计数器来标识数据报。当IP协议发送数据报时，就把这个计数器的当前值复制到标识字段中，并把这个计数器的值加1。当数据报被分片时，标识字段的值就复制到所有的分片中。
> ^28-2253-2349

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 同一数据报各个分片到达目的地，必须被重组为一个完整的数据报。目的主机在进行分片重组时，采用一组重组定时器。开始重组时即启动定时器，如果重组定时器超时仍然未能完成重组（由于某些分片没有及时到达目的主机），源主机的IP层将丢弃该数据报，并产生一个超时错误，报告给源主机。
> ^28-3396-3529

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 分片可以在源主机或传输路径上的任何一台路由器上进行，而分片的重组只能在目的主机上进行。
> ^28-3793-3836
## 第5章 ICMP协议

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ICMP属于网络层协议，是IP协议的重要补充，但是不能用来传送应用程序数据，只能用来传送有关网络事件和变化的通知报文。
> ^32-600-659
### 5.1 ICMP协议概述

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ICMP报文需要封装在IP数据报的数据部分进行传输。ICMP并不作为一个独立的层次，而只是作为IP层的一部分存在。
> ^33-662-719

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 根据RFC792文档，ICMP具有以下特性。
>
>·ICMP为路由器（网关）或目的主机提供了一种与源主机通信的机制。
>
>·ICMP报文采用了特殊格式的IP数据报，使用了特殊的关联报文类型和代码。
>
>·在TCP/IP的某些实现中，ICMP是一项必需的要素，通常作为提供IP基础支持的一部分。
>
>·ICMP仅仅报告有关非ICMP的IP数据报处理的错误。为防止出现有关错误消息的报文的无限循环，ICMP不传送有关自身的任何报文，并且仅仅提供任何分片数据报序列中第1个分片的报文。
> ^33-1080-1428

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 注意ICMP在IP层仅仅涉及与传输路径和可达相关的差错问题，而不解决数据本身的差错问题。
> ^33-2146-2190
### 5.2 ICMP差错报告

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ICMP协议只负责报告差错，而将纠正错误的工作留给上层协议去做，数据报的差错报告只发送给发出该数据报的源主机。
> ^34-449-504

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ICMP差错报告作为普通的IP数据报传输，并不享受特别的优先级和可靠性保证，另外在产生差错报告的同时会丢弃出错的IP数据报。
> ^34-504-566

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 携带ICMP差错报告报文本身的数据报不会再产生ICMP差错报告；分片的数据报如果不是第一个分片，则不会产生ICMP差错报告；具有多播地址或特殊地址（127.0.0.0或0.0.0.0）的数据报也不会产生ICMP差错报告。
> ^34-1202-1312

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 当大量的数据报进入路由器或目的主机时，会造成缓冲区溢出，即出现拥塞（Congestion）。
> ^34-4394-4440

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ICMP利用源抑制（SourceQuench，又译为源站抑制或源点抑制）的方法来进行拥塞控制，减缓源节点（发送方）发出数据报的速率。
> ^34-4440-4507

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ICMP的源抑制报文就是为了给IP协议增加一种流量控制而设计的。当路由器或主机因拥塞而丢弃数据报时，它就向数据报的源节点发送源抑制报文。此报文有两个目的，一是通知源节点数据报已被丢弃，二是警告发送方在路径中的某处出现了拥塞，因而源节点必须抑制发送过程，这实际上是拥塞发生后的事后控制。
> ^34-4536-4678

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 源抑制包括以下3个阶段。
>
>·发现拥塞阶段。路由器对缓冲区进行监测，一旦发现拥塞，立即向相应的源节点发送ICMP源抑制报文。通常在缓冲区满时丢弃当前的数据报，每丢弃一个数据报，都要向该数据报的源节点（发送方）发送一个源抑制报文。源节点收到源抑制报文后，获知拥塞已经发生，而且所发送的数据报已被丢弃。
>
>·解决拥塞阶段。源节点根据收到的源抑制报文中的原数据报的首部信息决定对发往某特定目标节点的数据流进行抑制，通常按一定规则降低发往该目标节点的数据报传输速率。
>
>·恢复阶段。拥塞解除后，源节点逐渐恢复数据报传输速率。在规定的时间段内未收到关于某目标节点的源抑制报文，源节点就认为发往该目标节点的拥塞已经解除。
> ^34-5026-5414

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 由于各个源节点的发送速率相差较大，源抑制的效果未必很好，另外源抑制报文本身会消耗网络带宽。默认情况下，大多数路由器不会发送源抑制报文。
> ^34-5443-5510
### 6.2 IP路由

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 同一网络区段中的计算机可以直接通信，不同网络区段中的计算机要相互通信，则必须借助于路由器。
> ^40-618-663
## 第7章 传输层协议——TCP与UDP

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 大部分Internet应用都使用TCP，因为它能够确保数据不会丢失和被破坏。
> ^46-675-713
### 7.1 传输层协议概述

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 TCP（TransmissionControlProtocol，传输控制协议）是传输层最重要和最常用的协议。它提供一种面向连接的、可靠的数据传输服务，保证了端到端数据传输的可靠性。
> ^47-1424-1516

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 TCP协议的特性
>
>·面向连接。它向应用程序提供面向连接的服务，两个需要通过TCP进行数据传输的进程之间首先必须建立一个TCP连接，并且在数据传输完成后要释放连接。一般将请求连接的应用进程称为客户进程，而响应连接请求的应用进程称为服务器进程，即TCP连接的建立采用的是一种客户/服务器模型。
>
>·全双工。它提供全双工数据传输服务，只要建立了TCP连接，就能在两个进程之间进行双向的数据传输服务，但是这种传输只是端到端的传输，不支持广播和多播。
>
>·可靠。TCP提供流量控制，解决接收方不能及时处理数据的问题；提供拥塞控制，解决因网络通信拥堵延迟带来的数据丢失问题；提供差错控制，解决数据被破坏、重复、失序和丢失的问题，从而保证数据传输的可靠性。
>
>·基于字节流。提供面向字节流的服务，即TCP数据传输是面向字节流的，两个建立了TCP连接的应用进程之间交换的是字节流。发送进程以字节流形式发送数据，接收进程也把数据作为字节流来接收。在传输层上数据被当做没有信息的字节序列来对待。
> ^47-1687-2238

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 UDP（UserDatagramProtocol，用户数据报协议）是不可靠的无连接的基于数据报的协议，支持无连接IP数据报的通信方式。相对TCP协议来说，UDP是一种非常简单的协议，在网络层的基础上实现了进程之间端到端的通信。
> ^47-2547-2662

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 UDP协议的特性
>
>与TCP协议不同，UDP协议提供的是一种无连接的、不可靠的数据传输方式。在UDP下每次的发送和接收，只构成一次通信。数据在传输之前通信双方不需要建立连接。接收方在收到UDP数据报之后不需要给出任何应答。UDP是发出去不管的“不可靠”通信。发送方发出的每一个UDP数据报都是独立的，都携带了完整的目的地址，可能选择不同的路径达到目的地，到达的先后顺序也可能不同于发送顺序。UDP在数据传输过程中没有流量控制和确认机制，数据报可能会丢失，或者延迟、乱序地到达目的地。
> ^47-2742-3010

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 不同协议的端口之间没有任何联系，不会相互干扰。
> ^47-5173-5196

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 可以用一个五元组（协议，本地主机地址，本地端口号，远程主机地址，远程端口号）来描述两个进程的关联。
> ^47-5261-5310

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 端口号是16位（bit）的标识符，因此取值范围是0～65535。
> ^47-5377-5409

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 小于1024的端口号用作公认端口，以全局方式进行分配，又称为注册端口或保留端口。
> ^47-5680-5720

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 临时端口号范围为1024～65535，以本地方式进行分配，又称为自由端口或动态端口。
> ^47-5824-5866

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 区分不同应用程序（进程）之间的网络通信和连接，需要传输层协议（TCP/UDP）、目的IP地址和端口号这3个参数进行标识。将这3个参数结合起来，就成为套接字（Socket）
> ^47-5992-6077

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 套接字之间的连接过程包括以下3个步骤。
>
>（1）服务器监听。服务器端套接字处于等待连接的状态，实时监控网络状态。
>
>（2）客户端请求。客户端套接字提出连接请求，要连接的目标是服务器端的套接字。
>
>（3）连接确认。当服务器端套接字监听到或者接收到客户端套接字的连接请求时，它就响应客户端套接字的请求，建立一个新的线程，把服务器端套接字的描述发给客户端，一旦客户端确认了此描述，连接就建立好了。
> ^47-6249-6525

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 套接字也是系统提供的进程通信编程接口，分为两种类型。流式Socket（SOCK_STREAM）是面向连接的Socket，针对于面向连接的TCP服务应用；数据报式Socket（SOCK_DGRAM）是无连接的Socket，对应于无连接的UDP服务应用。
> ^47-6617-6742
### 7.2 TCP段格式

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 位于传输层的TCP数据分组称为段（Segment），又译为报文段、数据段或分段。
> ^48-433-473

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 TCP为了提高效率，数据不会直接发送到对方，一般都先放在数据缓冲区中，等到数据积累到一定的大小才会一起发送。紧急指针所指向的一段数据不必等待缓冲数据的积累，直接发送到对方。
> ^48-3247-3333

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 注意不要混淆MSS和MTU。MSS是能够容纳在TCP首部后面数据的数量。MTU是能够放在MAC帧中数据的数量。例如，以太网帧通常使用的MTU是1518字节，MSS值为1460字节。如果没有分片发生，MSS越大越好，MSS值设置为外出接口上的MTU长度减去固定的IP首部和TCP首部长度，如一个以太网的MSS值可达1460字节。
> ^48-5094-5257

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 时间戳选项的一个功能是测量往返时间（RTT）。
> ^48-6319-6342

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 时间戳选项的另一个功能是防止序列号绕回（ProtectionAgainstWrappedSequencenumbers,PAWS）。
> ^48-6513-6584
### 7.3 TCP连接

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 但是，实际网络通信可能导致请求或响应丢失，可采用超时重传解决此问题，即请求或响应的丢失会造成定时器超时溢出，客户端将被迫再次发起连接请求，通过重传连接请求来建立连接。但这又有可能导致重复连接的问题。
> ^49-939-1038

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 需要注意的是，在服务器收到SYN请求时，在发送SYN/ACK给客户端之前，服务器要先分配一个数据区以服务于这个即将形成的TCP连接
> ^49-3777-3842

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 出现这种状态的情形是客户端丢失了网络连接或者发生了死机，由于并不知道客户端状态，服务器会不断发送SYN/ACK段，试图完成握手过程，这样会大量消耗服务器资源。如果人为利用这一点，就可以对服务器实施攻击。后面介绍的SYN洪泛（SYNFlood）攻击就是利用了这一握手过程。
> ^49-4136-4272

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 实际上TCP并不是每发送一个报文段就要等标有ACK标志的确认报文到达才能发送下一段报文的。通常是连续发送几段报文，然后等待服务器的回应；接着再发送几段报文，再等待回应。
> ^49-5084-5168

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 窗口越大，发送方一次可以传送的字节就越多，反之越少。窗口大小是会动态调整的
> ^49-5581-5618

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 参加交换数据的双方中的任何一方（客户端或服务器）都可以关闭连接。
> ^49-7729-7761

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 假定一方TCP向另一方并不存在的端口（或者目的端口没有打开，没有进程正在监听）发出连接请求，另一方TCP就发送RST置位的报文段来取消这个请求。而对于UDP来说，当一个数据报到达没有打开的目的端口时，它将产生一个ICMP端口不可达的信息。
> ^49-11868-11987

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 为了控制连接，TCP使用一种称为传输控制块（TransmissionControlBlock,TCB）的结构来保持每一条连接的有关信息
> ^49-12849-12919

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 TCP状态及其含义列举如下。
>
>·CLOSED：无连接状态。
>
>·LISTEN：侦听状态，等待连接请求SYN。
>
>·SYN-SENT：已发送连接请求SYN状态，等待确认ACK。
>
>·SYN-RCVD：已收到连接请求SYN状态。
>
>·ESTABLISHED：已建立连接状态。
>
>·FIN-WAIT-1：应用程序要求关闭连接，断开请求FIN已经发出状态。
>
>·FIN-WAIT-2：已关闭半连接状态，等待对方关闭另一个半连接。
>
>·CLOSING：双方同时决定关闭连接状态。
>
>·TIME-WAIT：等待超时状态。
>
>·CLSOE-WAIT：等待关闭连接状态，等待来自应用程序的关闭要求。
>
>·LAST-ACK：等待关闭确认状态。
>
>其中CLOSED是虚构的，因为它表示不存在TCB时的状态，没有连接。
> ^49-13358-14042

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 为响应事件，TCP连接过程从一个状态转换到另一个状态。这些事件包括以下类型。
>
>·用户调用。如打开（OPEN）、发送（SEND）、接收（RECEIVE）、关闭（CLOSE）、放弃（ABORT）和状态（STATUS）；
>
>·接收的报文段。特别是那些包含SYN、ACK、RST和FIN标志的段；
>
>·超时。
>
>状态转换图仅描绘状态改变，以及引起的事件和响应事件的行为，并没有说明与状态改变相关的错误状况和行为，因此该图不能作为规范。
> ^49-14520-14845

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 SYN洪泛攻击利用的是TCP三次握手连接建立的过程。当处于半开连接状态时，TCP服务器收到SYN而未收到ACK时，会为每个SYN包分配一个特定的数据区，攻击者利用这一特性在短时间内发送大量的SYN给服务器，只要这些SYN包具有不同的源地址（很容易伪造），就会给TCP服务器系统造成很大的系统负担，最终导致系统不能正常工作
> ^49-20996-21156
### 7.4 TCP可靠性

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 TCP采用的可靠性技术主要包括差错控制、流量控制和拥塞控制。
> ^50-456-486

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 TCP的差错控制包括检测损坏的报文段、丢失的报文段、失序的报文段和重复的报文段，并进行纠正。
> ^50-592-638

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 TCP在传输层上实现端到端的流量控制，为接收方对发送方发送数据进行控制，以避免大量的数据导致接收方瘫痪，这是通过滑动窗口机制来实现的。
> ^50-3979-4046

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 当发送窗口和接收窗口的大小都等于1时，每发送一个字节的数据都要等待对方的确认，这就是停止等待协议。当发送窗口大于1，接收窗口等于1时，就是回退N步协议。当发送窗口和接收窗口的大小均大于1时，就是选择重发协议。
> ^50-5237-5341

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 滑动窗口机制为端到端设备间的数据传输提供了可靠的流量控制机制。然而，它只能在源端设备和目的端设备起作用，当网络中间设备（如路由器等）发生拥塞时，滑动窗口机制将不起作用。
> ^50-7254-7338

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 为了避免和消除拥塞，RFC2581为TCP定义了4种拥塞控制机制，分别是慢启动（SlowStart）、拥塞避免（CongestionAvoidance）、快重传（FastRetransmit）和快恢复（FastRecovery）。
> ^50-7702-7855

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在TCP的拥塞控制中，仍然是利用发送窗口来控制数据流速度，减缓注入网络的数据流后，拥塞就会自然解除。
> ^50-7960-8010
### 10.4 电子邮件协议

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 一个简单的邮件地址大致可分成3部分：本地部分、分隔符“@”和域部分，典型的格式为“邮箱名@邮件服务器域名”。“@”左边的本地部分通常是用户的账户名称，也可以是代表另一个地址的别名。@右边的域部分通常是邮件服务器的网络域名。域（邮件域）是邮件服务器的基本管理单位，邮件服务以域为基础，每个邮箱对应一个用户，用户是邮件域的成员。
> ^68-3854-4016

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 邮件信息格式。
>
>一封信可分成两大部分：首部（Header）与主体（Body）。
> ^68-4048-4115
### 10.5 HTTP协议

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 状态码是针对请求的由3位十进制数组成的结果码，其中第1位数字定义了响应的类别，而其他两位数字则与分类无关，是自动形成的。第1位数字定义以下类别。
>
>·100～199表示信息，请求收到继续处理。其中绝大多数未使用，留作将来使用。
>
>·200～299表示成功，服务器对客户端发出请求的接收、理解和处理已成功完成。
>
>·300～399表示重定向，为完成请求所要求采取的操作，客户端需要重新提出请求。
>
>·400～499表示客户端错，请求中有语法错或请求不能被执行。
>
>·500～599表示服务器错，服务器错误地执行一个明显正确的请求。
> ^69-12616-13020

