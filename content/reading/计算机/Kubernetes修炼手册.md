---
doc_type: weread-highlights-reviews
bookId: "38153670"
title: Kubernetes修炼手册
reviewCount: 2
noteCount: 65
author: 奈吉尔·波尔顿
cover: https://cdn.weread.qq.com/weread/cover/5/YueWen_38153670/t6_YueWen_38153670.jpg
readingStatus: "4"
progress: 100%
readingTime: 1小时37分钟
readingDate: 2024-02-11
finishedDate: 2024-02-14
isbn: 9787115561091
category: 计算机 计算机综合
rating: 75.1%
readProgress: 100
readingTimestamp: 5842
lastReadDate: 2024-02-14
lastReadTimestamp: 1707921403
tags:
  - 读书笔记
  - 计算机
  - 计算机综合
  - 读完
totalWords:

---

# Kubernetes修炼手册

# 元数据
> [!abstract] Kubernetes修炼手册
> - ![ Kubernetes修炼手册|200](https://cdn.weread.qq.com/weread/cover/5/YueWen_38153670/t6_YueWen_38153670.jpg)
> - 书名： Kubernetes修炼手册
> - 作者： 奈吉尔·波尔顿
> - 简介： 本书是一本Kubernetes入门图书，共分为12章，涵盖了Kubernetes的基础知识，并附带了大量的配置案例。此外，还介绍了Kubernetes架构、构建Kubernetes集群、在Kubernetes上部署和管理应用程序、Kubernetes安全，以及云本地、微服务、容器化等术语的含义。本书在内容上不断进行充实和完善，可以帮助读者快速入门Kubernetes。本书适合系统管理员、开发人员，以及对Kubernetes感兴趣的初学者阅读。
> - 出版时间 2021-05-01 00:00:00
> - ISBN： 9787115561091
> - 分类： 计算机-计算机综合
> - 出版社： 人民邮电出版社



---

# 高亮划线

### 2.1 Kubernetes概览

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Deployment）提供可扩展性和滚动更新，DaemonSet在集群的每个工作节点中都运行相应服务的实例，有状态应用部署于StatefulSet，同时那些需要不定期运行的临时任务则由定时任务（CronJob）来管理。
> ^14-2851-2960
### 2.2 主节点与工作节点

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 一个Kubernetes集群由主节点（master）与工作节点（node）组成。
> ^15-378-474

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes的主节点（master）是组成集群的控制平面的系统服务的集合。
> ^15-608-677

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 APIServer（API服务）是Kubernetes的中央车站。所有组件之间的通信，都需要通过APIServer来完成。
> ^15-1190-1253

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 APIServer对外通过HTTPS的方式提供了RESTful风格的API接口，读者上传YAML配置文件也是通过这种接口实现的。
> ^15-1355-1420

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 etcd认为一致性比可用性更加重要。这意味着etcd在出现脑裂的情况时，会停止为集群提供更新能力，来保证存储数据的一致性。
> ^15-2078-2139

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 就算etcd不可用，应用仍然可以在集群性持续运行，只不过无法更新任何内容而已。
> ^15-2142-2181

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 etcd使用业界流行的RAFT一致性算法来解决这个问题。
> ^15-2276-2304

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 controller管理器实现了全部的后台控制循环，完成对集群的监控并对事件作出响应。
> ^15-2388-2431

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 （1）获取期望状态。
>
>（2）观察当前状态。
>
>（3）判断两者间的差异。
>
>（4）变更当前状态来消除差异点。
> ^15-2896-3022

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 每个组件都专注做好一件事，复杂系统是通过多个专一职责的组件组合而构成的。
> ^15-3256-3292

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 从整体上来看，调度器的职责就是通过监听APIServer来启动新的工作任务，并将其分配到适合的且处于正常运行状态的节点中。
> ^15-3366-3428

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 调度器并不负责执行任务，只是为当前任务选择一个合适的节点运行。
> ^15-3881-3912

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 1.监听APIServer分派的新任务。
>
>2.执行新分派的任务。
>
>3.向控制平面回复任务执行的结果（通过APIServer）。
> ^15-4984-5099

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubelet是每个工作节点上的核心部分，是Kubernetes中重要的代理端，并且在集群中的每个工作节点上都有部署。实际上，通常工作节点与Kubelet这两个术语基本上是等价的。
> ^15-5475-5621

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubelet的一个重要职责就是负责监听APIServer新分配的任务。每当其监听到一个任务时，Kubelet就会负责执行该任务，并维护与控制平面之间的一个通信频道，准备将执行结果反馈回去。
> ^15-5778-5874

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 CRI屏蔽了Kubernetes内部运行机制，并向第三方容器运行时提供了文档化接口来接入。
> ^15-6325-6370

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 kube-proxy运行在集群中的每个工作节点，负责本地集群网络。
> ^15-6848-6881
### 2.3 Kubernetes DNS

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 集群DNS服务有一个静态IP地址，并且这个IP地址集群总每个Pod上都是硬编码的，这意味着每个容器以及Pod都能找到DNS服务。每个新服务都会自动注册到集群DNS服务上，这样所有集群中的组件都能根据名称找到相应的服务。
> ^16-471-580

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 集群DNS是基于CoreDNS来实现的。
> ^16-662-682
### 2.5 声明式模型与期望状态

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 kubectl会将manifest文件通过HTTPPOST请求发送到控制平面，通常HTTP服务使用的端口是443。
> ^18-1266-1324

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 调度工作包括拉取镜像、启动容器、构建网络以及启动应用进程。
> ^18-1558-1587

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 命令式模式是指用户需要指定一大串针对特定平台的命令来解决相应的问题。
> ^18-2114-2148
### 2.6 Pod

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Pod就是为用户在宿主机操作系统中划出有限的一部分特定区域，构建一个网络栈，创建一组内核命名空间，并且在其中运行一个或者多个容器，这就是Pod。
> ^19-1859-1931
### 2.7 Deployment

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 上层的控制器包括Deployment、DaemonSet以及StatefulSet。
> ^20-406-532
### 2.8 服务与稳定的网络

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Service为一组Pod提供了可靠且稳定的网络。
> ^21-803-828

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 这就是Service的职责：一个稳定的网络终端，提供了基组动态Pod集合的TCP以及UDP负载均衡能力。
> ^21-1505-1557
### 4.1 Pod原理

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 一般来说，在微服务的设计模式中应当分离需求点，意思就是一个容器实现一个需求点。
> ^35-2033-2072

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Pod中的所有容器都共享主机名、IP地址、内存地址空间以及卷。
> ^35-4271-4302

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 每个Pod会创建其自己的网络命名空间。其中包括一个IP地址、一组TCP和UDP端口范围，以及一个路由表。
> ^35-4426-4478

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 同一个Pod中的两个容器可以有不同的CGroup限额。
> ^35-6396-6423

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 典型的Pod生命周期是这样的：用户定义一个YAML格式的清单文件，并将其POST到APIServer。一旦发送成功，清单文件中的内容就被作为一条意图记录（arecordofintent）——即“期望状态”（desiredstate）——持久化记录在集群存储中，然后Pod被调度到一个健康的、有充足资源的节点上。一旦完成调度，就会进入等待状态（pendingstate），此时节点会下载镜像并启动容器。在所有资源就绪前，Pod的状态都保持在等待状态。一切就绪后，Pod进入运行状态（runningstate）。在完成所有任务后，会停止并进入成功状态（succeededstate）。
> ^35-6824-7122
### 4.2 Pod实战

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubelet进程是Kubernetes在节点上的代理（agent）程序。
> ^36-5322-5359
### 5.1 Deployment原理

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Deployment在底层利用了另一种名为ReplicaSet的对象。
> ^39-1093-1128

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Deployment使用ReplicaSet来提供自愈和扩缩容能力。
> ^39-1194-1228

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 可以理解为Deployment管理ReplicaSet，ReplicaSet管理Pod。
> ^39-1550-1594

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes支持两种模型，不过更加青睐于声明式模型。
> ^39-3892-3922

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 期望状态能够实现的基础是底层调谐循环（reconciliationloop，也称作controlloop）的概念。
> ^39-3997-4056

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Deployment在更新前创建的ReplicaSet位于左侧，更新后创建了右侧的ReplicaSet。可以看到，更新前创建的ReplicaSet已经暂停，并不包含任何Pod。更新后的ReplicaSet已经启动了所有Pod。
> ^39-5986-6099

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 回滚与滚动升级的过程正好相反：启用旧的ReplicaSet，停用当前的ReplicaSet。
> ^39-6553-6599
### 5.2 如何创建一个Deployment

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ReplicaSet的名称其实是Deployment的名称与一个hash值的拼接。
> ^40-3813-3854
### 5.3 执行滚动升级

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 更新的过程可以通过执行kubectlrolloutstatus来查看。
> ^41-2783-2843
### 6.1 要点前瞻

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 每一个Service都拥有固定的IP地址、固定的DNS名称，以及固定的端口。
> ^45-773-811

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Service利用Label来动态选择将流量转发至哪些Pod。
> ^45-840-871
### 6.2 原理

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Service与Pod之间是通过Label和Label筛选器（selector）松耦合在一起的。
> ^46-1372-1420

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 每一个Service在被创建的时候，都会得到一个关联的Endpoint对象。整个Endpoint对象其实就是一个动态的列表，其中包含集群中所有的匹配ServiceLabel筛选器的健康Pod。
> ^46-4321-4418

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ClusterIPService拥有固定的IP地址和端口号，并且仅能够从集群内部访问得到。
> ^46-5049-5095

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 NodePortService在此基础上增加了另一个端口，这个用来从集群外部访问到Service的端口叫作NodePort。
> ^46-6067-6130

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 LoadBalancerService能够与诸如AWS、Azure、DO、IBM云和GCP等云服务商提供的负载均衡服务集成。
> ^46-7404-7467

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ●运行DNS服务的控制层Pod。
>
>●一个面向所有Pod的名为kube-dns的服务。
>
>●Kubelet为每一个容器都注入了该DNS（通过/etc/resolv.conf）。
> ^46-8140-8322

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 DNS插件会持续监测APIServer中新Service的动向，并且自动注册到DNS中。因此，每一个Service都有一个可以在整个集群范围内都能解析的DNS名称。
> ^46-8350-8433

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Service的核心作用就是为Pod提供稳定的网络连接。除此之外，还提供负载均衡和从集群外部访问Pod的途径。
> ^46-8769-8824
### 7.2 服务注册

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 每一个节点上都运行着一个kube-proxy，它能够为新的Service和Endpoint创建IPVS规则，从而到达Service的ClusterIP的流量会被转发至匹配Label筛选器的某一个Pod上。
> ^52-5079-5181
### 7.3 服务发现

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 kube-proxy是一个基于Pod的Kubernetes原生应用，它实现了一个能够监视APIServer上新创建的Service和Endpoint的控制器。当它有新发现时，就回创建一条本地的IPVS规则，该规则告诉主机节点拦截发往Service的ClusterIP的流量，并发送至具体的Pod。
> ^53-3685-3841

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在Kubernetes1.11之后替换为IPVS
> ^53-4015-4040
### 7.4 服务发现与命名空间

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 FQDN的格式是<object-name>.<namespace>.svc.cluster.local。
> ^54-760-847

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 同一命名空间内部的对象名称必须是唯一的，不过不同命名空间之间的对象可以重名。
> ^54-1214-1252
### 7.5 服务发现问题排查

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 所有与集群DNS相关的对象都有K8s-app=kube-dns的Label。
> ^55-861-922
### 11.1 安全模型

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 STRIDE定义了6种潜在威胁。
>
>●伪装（Spoofing）。
>
>●篡改（Tampering）。
>
>●抵赖（Repudiation）
>
>●信息泄露（InformationDisclosure）。
>
>●拒绝服务（DenialofService）。
>
>●提升权限（ElevationofPrivilege）。
> ^75-517-819
### 11.2 伪装

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes所实现的安全模型，要求组件使用mutualTSL（mTLS）认证。这就要求通信双方（发送方和接收方）必须通过加密的签名证书来相互认证。
> ^76-875-953

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 可以利用KubernetesSecret将证书挂载到Pod，来对Pod进行安全认证。
> ^76-1846-1889

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes在具体实现时，会自动将一个服务账号令牌（Serviceaccounttoken）作为Secret挂载到每一个Pod中。
> ^76-1986-2057
### 12.2 基础设施与网络

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes的命名空间，并不能保证某一个命名空间中的Pod不会影响到另一个命名空间中的Pod。
> ^87-934-985

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 唯一能够确保真正的隔离的方式是将其置于一个独立的集群中运行。
> ^87-1018-1048

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Kubernetes命名空间还是有用的，而且我们应当使用它——只是不要将其作为安全边界来使用。
> ^87-1079-1152
# 读书笔记

### 2.6 Pod

> [!Annotation]+ <span style="color: ;">Annotation</span>
> 📌 因为Kubernetes会启动一个新的Pod来取代有问题的Pod。 
> ^439222474-7OTVRll4v
> ---
> 💭 如果没有controller是不会自动创建新pod的，不过，生产环境通常没有这种情况

### 12.1 CI/CD流水线

> [!Annotation]+ <span style="color: ;">Annotation</span>
> 📌 而且有效解决了那个“在我的计算机上可以运行啊”的令人无语的问题。 
> ^439222474-7OYUl6ntr
> ---
> 💭 XD
