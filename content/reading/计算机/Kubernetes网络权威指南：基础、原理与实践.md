---
doc_type: weread-highlights-reviews
bookId: "27741281"
reviewCount: 0
noteCount: 65
author: 杜军
cover: https://wfqqreader-1252317822.image.myqcloud.com/cover/281/27741281/t6_27741281.jpg
progress: 100%
readingTime: 10小时32分钟
readingDate: 2024-02-20
finishedDate: 2024-02-29
isbn: 9787121373398
category: 计算机 计算机综合
title: Kubernetes网络权威指南：基础、原理与实践
rating: 81.5%
readProgress: 100
readingTimestamp: 37961
lastReadDate: 2024-02-29
lastReadTimestamp: 1709197266
tags:
  - 读书笔记
  - 计算机
  - 计算机综合
  - 读完
totalWords: 203519

---

# Kubernetes网络权威指南：基础、原理与实践

# 元数据
> [!abstract] Kubernetes网络权威指南：基础、原理与实践
> - ![ Kubernetes网络权威指南：基础、原理与实践|200](https://wfqqreader-1252317822.image.myqcloud.com/cover/281/27741281/t6_27741281.jpg)
> - 书名： Kubernetes网络权威指南：基础、原理与实践
> - 作者： 杜军
> - 简介： 本书是容器与Kubernetes网络的基础和进阶书籍，旨在让更多人了解和学习云原生时代的底层网络模型与实现机制，指导企业在落地云原生时的网络方案选型。全书包括：容器网络虚拟化基础、Docker容器网络、Kubernetes网络和Istio网络4部分，共6章。第1章容器网络虚拟化基础将支撑容器网络的内核技术娓娓道来。第2章简单介绍了Docker原生的容器网络能力。Kubernetes网络分为3章，第3章介绍Kubernetes网络的基础概念和使用，第4章为读者剖析了Kubernetes网络的底层实现原理，第5章详解了业界主流的Kubernetes网络插件。Istio网络总共1章，重点解析Istio网络流量管控的背后机制。
> - 出版时间 2019-10-01 00:00:00
> - ISBN： 9787121373398
> - 分类： 计算机-计算机综合
> - 出版社： 电子工业出版社



---

# 高亮划线

## 第1章 夯实基础：Linux网络虚拟化

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Linux的namespace（名字空间）的作用就是“隔离内核资源”。在Linux的世界里，文件系统挂载点、主机名、POSIX进程间通信消息队列、进程PID数字空间、IP地址、userID数字空间等全局系统资源被namespace分割，装到一个个抽象的独立空间里。而隔离上述系统资源的namespace分别是Mountnamespace、UTSnamespace、IPCnamespace、PIDnamespace、networknamespace和usernamespace。
> ^6-644-890

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 它只是移除了这个networknamespace对应的挂载点（下文会解释）。只要里面还有进程运行着，networknamespace便会一直存在。
> ^6-3785-3860

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 clone（）总共有二十多种CLONE_*标志位用来控制clone（克隆）进程时的行为。例如，是否与父进程共享虚拟内存、打开的文件描述符、信号处理等。
> ^6-9499-9574

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 大部分Linuxnamespace（usernamespace除外）的创建都需要系统特权（capability），不一定是完整的root权限，但需要拥有CAP_SYS_ADMIN权限集来执行必要的系统调用。
> ^6-10185-10290
### 1.2 千呼万唤始出来：veth pair

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 veth是虚拟以太网卡（VirtualEthernet）的缩写。veth设备总是成对的，因此我们称之为vethpair。
> ^7-648-710
### 1.3 连接你我他：Linux bridge

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Linuxbridge不能跨机连接网络设备。
> ^8-907-930

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Linuxbridge不会区分接入进来的到底是物理设备还是虚拟设备，对它来说没有区别。
> ^8-7410-7454

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ifconfigeth0，查看eth0的配置，包括混杂模式。当输出包含PROMISC时，表明该网络接口处于混杂模式。
> ^8-12703-12762

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 将网络设备加入Linuxbridge后，会自动进入混杂模式。
> ^8-13450-13481
### 1.4 给用户态一个机会：tun/tap设备

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 tun/tap设备到底是什么？从Linux文件系统的角度看，它是用户可以用文件句柄操作的字符设备；从网络虚拟化角度看，它是虚拟网卡，一端连着网络协议栈，另一端连着用户态程序。
> ^9-595-682

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 tun/tap设备可以将TCP/IP协议栈处理好的网络包发送给任何一个使用tun/tap驱动的进程，由进程重新处理后发到物理链路中。
> ^9-870-936

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 tap设备与tun设备的工作原理完全相同，区别在于：
>
>·tun设备的/dev/tunX文件收发的是IP包，因此只能工作在L3，无法与物理网卡做桥接，但可以通过三层交换（例如ip_forward）与物理网卡连通；
>
>·tap设备的/dev/tapX文件收发的是链路层数据包，可以与物理网卡做桥接。
> ^9-2309-2511
### 1.5 iptables

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 iptables是用户空间的一个程序，通过netlink和内核的netfilter框架打交道，负责往钩子上配置回调函数。
> ^10-2689-2749

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 我们常说的iptables5X5，即5张表（table）和5条链（chain）。5条链即iptables的5条内置链，对应上文介绍的netfilter的5个钩子。这5条链分别是：
>
>·INPUT链：一般用于处理输入本地进程的数据包；
>
>·OUTPUT链：一般用于处理本地进程的输出数据包；
>
>·FORWARD链：一般用于处理转发到其他机器/networknamespace的数据包；
>
>·PREROUTING链：可以在此处进行DNAT；
>
>·POSTROUTING链：可以在此处进行SNAT。
>
>除了系统预定义的5条iptables链，用户还可以在表中定义自己的链，我们将通过例子详细说明。
>
>5张表如下所示。
>
>·filter表：用于控制到达某条链上的数据包是继续放行、直接丢弃（drop）或拒绝（reject）；
>
>·nat表：用于修改数据包的源和目的地址；
>
>·mangle表：用于修改数据包的IP头信息；
>
>·raw表：iptables是有状态的，即iptables对数据包有连接追踪（connectiontracking）机制，而raw是用来去除这种追踪机制的；
>
>·security表：最不常用的表（通常，我们说iptables只有4张表，security表是新加入的特性），用于在数据包上应用SELinux。
>
>这5张表的优先级从高到低是：raw、mangle、nat、filter、security。需要注意的是，iptables不支持用户自定义表。
> ^10-3115-4362

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 iptables的规则就是挂在netfilter钩子上的函数，用来修改数据包的内容或过滤数据包，iptables的表就是所有规则的5个逻辑集合！
> ^10-5319-5391

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 数据包匹配后该怎么办，常见的动作有下面几个：
>
>·DROP：直接将数据包丢弃，不再进行后续的处理。应用场景是不让某个数据源意识到你的系统的存在，可以用来模拟宕机；
>
>·REJECT：给客户端返回一个connectionrefused或destinationunreachable报文。应用场景是不让某个数据源访问你的系统，善意地告诉他：我这里没有你要的服务内容；
>
>·QUEUE：将数据包放入用户空间的队列，供用户空间的程序处理；
>
>·RETURN：跳出当前链，该链里后续的规则不再执行；
>
>·ACCEPT：同意数据包通过，继续执行后续的规则；
>
>·JUMP：跳转到其他用户自定义的链继续执行。
> ^10-5657-6118

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 由于自定义的链没有与netfilter里的钩子进行绑定，所以它不会自动触发，只能从其他链的规则中跳转过来，这也是JUMP动作存在的意义。
> ^10-6183-6251

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 如果iptables规则前面是自定义链，则意味着这条规则的动作是JUMP，即跳到这条自定义链遍历其下的所有规则，然后跳回来遍历原来那条链后面的规则。
> ^10-7630-7704
### 1.7 Linux隧道网络的代表：VXLAN

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 VXLAN（VirtualeXtensibleLAN，虚拟可扩展的局域网），是一种虚拟化隧道通信技术。它是一种overlay（覆盖网络）技术，通过三层的网络搭建虚拟的二层网络。
> ^12-426-516

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 简单来讲，VXLAN是在底层物理网络（underlay）之上使用隧道技术，依托UDP层构建的overlay的逻辑网络，使逻辑网络与物理网络解耦，实现灵活的组网需求。
> ^12-673-755

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 一个VXLAN设备能通过像网桥一样的学习方式学习到其他对端的IP地址，也可以直接配置静态转发表。
> ^12-909-957

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 VXLAN的报文就是MACinUDP，即在三层网络的基础上构建一个虚拟的二层网络。
> ^12-3643-3686
### 1.8 物理网卡的分身术：Macvlan

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 使用Macvlan技术带来的效果是一块物理网卡上可以绑定多个IP地址，每个IP地址都有自己的MAC地址。
> ^13-1100-1152
### 2.2 打开万花筒：Docker的四大网络模式

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 容器的网络方案可以分为三大部分：
>
>·单机的容器间通信；
>
>·跨主机的容器间通信；
>
>·容器与主机间通信。
> ^16-641-775

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Docker有以下4种网络模式：
>
>·bridge模式，通过--network=bridge指定；
>
>·host模式，通过--network=host指定；
>
>·container模式，通过--network=container:NAME_or_ID指定，即joiner容器；
>
>·none模式，通过--network=none指定。
> ^16-911-1186

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 host模式下容器将不会获得独立的networknamespace，而是和宿主机共用一个networknamespace。容器将不会虚拟出自己的网卡，配置自己的IP等，而是使用宿主机的IP和端口。
> ^16-3315-3415

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes的Pod网络采用的就是Docker的container模式网络
> ^16-5013-5054
### 3.2 终于等到你：Kubernetes网络

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes网络包括网络模型、CNI、Service、Ingress、DNS等。
> ^22-500-544

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 实现Kubernetes的容器网络重点需要关注两方面：IP地址分配和路由。
> ^22-1152-1189

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 集群内访问Pod，会经过Service；集群外访问Pod，经过的是Ingress。
> ^22-3163-3204

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 bridge网络本身不解决容器的跨机通信问题，需要显式地书写主机路由表，映射目标容器网段和主机IP的关系，集群内如果有N个主机，需要N-1条路由表项。
> ^22-7426-7501
### 3.3 Pod的核心：pause容器

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 pause容器被当作Pod中所有容器的“父容器”，并为每个业务容器提供以下功能：
>
>·在Pod中，它作为共享Linuxnamespace（Network、UTS等）的基础；
>
>·启用PIDnamespace共享，它为每个Pod提供1号进程，并收集Pod内的僵尸进程。
> ^23-1236-1425

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 init进程的其中一个作用是当某个子进程由于父进程的错误退出而变成了“孤儿进程”，便会被init进程“收养”并在该进程退出时回收资源。
> ^23-4125-4192

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 僵尸进程无法通过kill命令清除。
> ^23-4426-4443

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 僵尸进程是已停止运行但进程表条目仍然存在的进程，父进程尚未通过wait系统调用进行检索。从技术层面来说，终止的每个进程都算是一个僵尸进程，尽管只是在很短的时间内发生的。当用户程序写得不好并且简单地省略wait系统调用，或者当父进程在子进程之前异常退出并且新的父进程没有调用wait检索子进程时，会出现较长时间的僵尸进程。系统中存在过多僵尸进程将占用大量操作系统进程表资源。
> ^23-4472-4658

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 当在主机上发送SIGKILL或者SIGSTOP（也就是dockerkill或者dockerstop命令）强制终止容器的运行时，其实就是在终止容器内的init进程。一旦init进程被销毁，同一PIDnamespace下的进程也随之被销毁。
> ^23-4956-5077
### 3.5 找到你并不容易：从集群内访问服务

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Service具有稳定的IP地址（区别于容器不固定的IP地址）和端口，并会在一组匹配的后端Pod之间提供负载均衡，匹配的条件就是Service的LabelSelector与Pod的Labels相匹配。
> ^25-1262-1363

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes的Service代表的是Kubernetes后端服务的入口，它主要包含服务的访问IP（虚IP）和端口，因此工作在L4。
> ^25-1973-2042

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes使用Kube-proxy组件管理各服务与之后端Pod的连接，该组件在每个节点上运行。Kube-proxy是一个基于出站流量的负载平衡控制器，它监控KubernetesAPIService并持续将服务IP（包括ClusterIP等）映射到运行状况良好的Pod，落实到主机上就是iptables/IPVS等路由规则。访问服务的IP会被这些路由规则直接DNAT到PodIP，然后走底层容器网络送到对应的Pod。
> ^25-3006-3222

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 KubernetesService能够支持TCP、UDP和SCTP三种协议，默认是TCP协议。
> ^25-4001-4049

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ervice的几个port的概念很容易混淆，它们分别是port、targetPort和NodePort。
>
>port表示Service暴露的服务端口，也是客户端访问用的端口，例如ClusterIP:port是提供给集群内部客户访问Service的入口。需要注意的是，port不仅是ClusterIP上暴露的端口，还可以是externalIP和LoadBalancerIP。Service的port并不监听在节点IP上，即无法通过节点IP:port的方式访问Service。
>
>NodePort是Kubernetes提供给集群外部访问Service入口的一种方式（另一种方式是LoadBalancer），所以可以通过NodeIP:nodePort的方式提供集群外访问Service的入口。需要注意的是，我们这里说的集群外指的是Pod网段外，例如Kubernetes节点或因特网。
>
>targetPort很好理解，它是应用程序实际监听Pod内流量的端口，从port和NodePort上到来的数据，最终经过Kube-proxy流入后端Pod的targetPort进入容器。
> ^25-6930-7501

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kube-proxy通过在节点上iptables规则管理此端口的重新映射过程。
> ^25-7589-7628

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 NodePort支持TCP、UDP、SCTP，默认端口范围是30000-32767，Kubernetes在创建NodePort类型Service对象时会随机选取一个。
> ^25-10401-10484

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 某个NodePort被打开后，主机上其他进程将无法再使用该端口，除非Service被删除该端口才会被释放。
> ^25-11682-11735

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 但NodePort的问题集中体现在性能和可对宿主机端口占用方面。
> ^25-11923-11955

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 所谓的无头（headless）Service即没有selector的Service。
> ^25-13656-13698

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Service没有selector，就不会创建相关的Endpoints对象。
> ^25-14203-14241

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 要指定流量必须转到同一节点上的Pod，可以将serviceSpec.externalTrafficPolicy设置为Local（默认是Cluster）
> ^25-15488-15564

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 将externalTrafficPolicy设置为Local时，负载平衡器仅将流量发送到具有属于服务的正常Pod所在的节点。
> ^25-15782-15844

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 externalTrafficPolicy只支持NodePort和LoadBalancer的Service，不支持ClusterIP
> ^25-15949-16017
### 3.6 找到你并不容易：从集群外访问服务

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在Kubernets中，L7的转发功能、集群外访问Service，都是专门交给Ingress的。
> ^26-798-846

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 KubernetesIngress提供了负载平衡器的典型特性：HTTP路由、黏性会话、SSL终止、SSL直通、TCP和UDP负载平衡等。
> ^26-993-1062

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes的Ingress资源对象是指授权入站连接到达集群内服务的规则集合。
> ^26-1527-1570

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Ingress是建立在Service之上的L7访问入口，它支持通过URL的方式将Service暴露到k8s集群外；支持自定义Service的访问策略；提供按域名访问的虚拟主机功能；支持TLS通信。
> ^26-2282-2380
### 3.7 你的名字：通过域名访问服务

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 完全限定域名（FQDN）
> ^27-2152-2164

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 目前，KubernetesDNS加载项支持正向查找（ARecord）、端口查找（SRV记录）、反向IP地址查找（PTR记录）及其他功能。
> ^27-2185-2284

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 对于Service，KubernetesDNS服务器会生成三类DNS记录，分别是A记录、SRV记录和CNAME记录。
> ^27-2284-2343

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes域名解析策略对应到Pod配置中的dnsPolicy，有4种可选策略，分别是None、ClusterFirstWithHostNet、ClusterFirst和Default
> ^27-8708-8804
## 第4章 刨根问底：Kubernetes网络实现机制

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kube-proxy的LoadBalancer模块实现有userspace、iptables和IPVS三种，当前主流的实现方式是iptables和IPVS。
> ^30-1380-1459

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kube-proxy的转发模式可以通过启动参数--proxy-mode进行配置，有userspace、iptables、ipvs等可选项。
> ^30-1536-1605

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 IPVS是Linux内核实现的四层负载均衡，是LVS负载均衡模块的实现。
> ^30-10330-10366

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 IPVS支持TCP、UDP、SCTP、IPv4、IPv6等协议，也支持多种负载均衡策略，例如rr、wrr、lc、wlc、sh、dh、lblc等。IPVS通过persistentconnection调度算法原生支持会话保持功能。
> ^30-10475-10589

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 IPVS支持三种负载均衡模式：DirectRouting（简称DR）、Tunneling（也称ipip模式）和NAT（也称Masq模式）。
> ^30-11154-11224
### 4.3 沧海桑田：Kubernetes DNS架构演进之路

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 无论是Kube-dns还是CoreDNS，基本原理都是利用watchKubernetes的Service和Pod，生成DNS记录，然后通过重新配置Kubelet的DNS选项让新启动的Pod使用Kube-dns或CoreDNS提供的Kubernetes集群内域名解析服务。
> ^32-14277-14413
### 6.2 Istio：引领新一代微服务架构潮流

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Istio分为两个平面：数据平面和控制平面。
> ^42-833-855

