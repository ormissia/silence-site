---
doc_type: weread-highlights-reviews
bookId: "3300055509"
reviewCount: 0
noteCount: 35
author: 张超盟 等
cover: https://cdn.weread.qq.com/weread/cover/74/cpplatform_89br3rqhwrf9z4leqcjnp5/t6_cpplatform_89br3rqhwrf9z4leqcjnp51681457871.jpg
progress: 36%
readingTime: 4小时47分钟
readingDate: 2024-01-16
isbn: 9787121366536
category: 计算机 理论知识
title: 云原生服务网格Istio：原理、实践、架构与源码解析
rating: 0%
readProgress: 36
readingTimestamp: 17241
lastReadDate: 2024-01-19
lastReadTimestamp:
tags:
  - 读书笔记
  - 计算机
  - 理论知识
  - 在读
totalWords: 273677

---

# 云原生服务网格Istio：原理、实践、架构与源码解析

# 元数据
> [!abstract] 云原生服务网格Istio：原理、实践、架构与源码解析
> - ![ 云原生服务网格Istio：原理、实践、架构与源码解析|200](https://cdn.weread.qq.com/weread/cover/74/cpplatform_89br3rqhwrf9z4leqcjnp5/t6_cpplatform_89br3rqhwrf9z4leqcjnp51681457871.jpg)
> - 书名： 云原生服务网格Istio：原理、实践、架构与源码解析
> - 作者： 张超盟 等
> - 简介： 本书分为原理篇、实践篇、架构篇和源码篇，由浅入深地将Istio项目庖丁解牛并呈现给读者。原理篇介绍了服务网格技术与Istio项目的技术背景、设计理念与功能原理，能够帮助读者了解服务网格这一云原生领域的标志性技术，掌握Istio流量治理、策略与遥测和安全功能的使用方法。实践篇从零开始搭建Istio运行环境并完成一个真实应用的开发、交付、上线监控与治理的完整过程，能够帮助读者熟悉Istio的功能并加深对Istio的理解。架构篇剖析了Istio项目的三大核心子项目Pilot、Mixer、Citadel的详细架构，帮助读者熟悉Envoy、Galley、Pilot-agent等相关项目，并挖掘Istio代码背后的设计与实现思想。源码篇对Istio各个项目的代码结构、文件组织、核心流程、主要数据结构及各主要代码片段等关键内容都进行了详细介绍，读者只需具备一定的Go语言基础，便可快速掌握Istio各部分的实现原理，并根据自己的兴趣深入了解某一关键机制的完整实现。本书提供源码下载，参见http://github.com/cloudnativebooks/cloud-native-istio。无论是对于刚入门Istio的读者，还是对于已经在产品中使用Istio的读者，本书都极具参考价值。
> - 出版时间 2019-06-01 00:00:00
> - ISBN： 9787121366536
> - 分类： 计算机-理论知识
> - 出版社： 电子工业出版社



---

# 高亮划线

### 第1章 你好，Istio

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 微服务是一套理论，Istio是一种实践。
> ^7-9377-9397

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 引入两个问题：
>
>◎增加了两处延迟和可能的故障点；
>
>◎多出来的这两跳对于访问性能、整体可靠性及整个系统的复杂度都带来了新的挑战。
> ^7-12349-12470

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 基于xDS协议提供了一套标准的控制面规范，向数据面传递服务信息和治理规则。
> ^7-14120-14157

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Istio的所有路由规则和控制策略都是通过KubernetesCRD实现的，因此各种规则策略对应的数据也被存储在Kube-apiserver中，不需要另外一个单独的APIServer和后端的配置管理。
> ^7-19057-19158
### 第2章 Istio架构概述

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 控制面主要包括Pilot、Mixer、Citadel等服务组件；数据面由伴随每个应用程序部署的代理程序Envoy组成，执行针对应用程序的治理逻辑。
> ^8-764-837

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 (1)自动注入：指在创建应用程序时自动注入Sidecar代理。
> ^8-1154-1185

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 (2)流量拦截：在Pod初始化时设置iptables规则，当有流量到来时，基于配置的iptables规则拦截业务容器的Inbound流量和Outbound流量到Sidecar上。
> ^8-1597-1686

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 (3)服务发现：服务发起方的Envoy调用管理面组件Pilot的服务发现接口获取目标服务的实例列表。
> ^8-1840-1890

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 (4)负载均衡：服务发起方的Envoy根据配置的负载均衡策略选择服务实例，并连接对应的实例地址。
> ^8-1984-2032

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 (5)流量治理：Envoy从Pilot中获取配置的流量规则，在拦截到Inbound流量和Outbound流量时执行治理逻辑。
> ^8-2116-2178

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 (6)访问安全：在服务间访问时通过双方的Envoy进行双向认证和通道加密，并基于服务的身份进行授权管理。
> ^8-2324-2376

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 (7)服务遥测：在服务间通信时，通信双方的Envoy都会连接管理面组件Mixer上报访问数据，并通过Mixer将数据转发给对应的监控后端。
> ^8-2499-2568

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 (8)策略执行：在进行服务访问时，通过Mixer连接后端服务来控制服务间的访问，判断对访问是放行还是拒绝。
> ^8-2659-2712

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 (9)外部访问：在网格的入口处有一个Envoy扮演入口网关的角色。
> ^8-2798-2831

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在Kubernetes中，一般先通过Deploymnent创建工作负载，再通过创建Service关联这些工作负载，从而暴露工作负载的接口。因而看上去主体是工作负载，Service只是一种访问方式，某些后台执行的负载若不需要被访问，就不用定义Service。在Istio中，Service是治理的对象，是Istio中的核心管理实体，所以在Istio中，Service是一个提供了对外访问能力的执行体，可以将其理解为一个定义了服务的工作负载，没有访问方式的工作负载不是Istio的管理对象，Kubernetes的Service定义就是Istio服务的元数据。
> ^8-5715-5992

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 服务列表中的istio-pilot是Istio的控制中枢Pilot服务。
> ^8-9661-9697

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 istio-telemetry是专门用于收集遥测数据的Mixer服务组件。
> ^8-10956-10993

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 istio-policy是另外一个Mixer服务，和istio-telemetry基本上是完全相同的机制和流程。
> ^8-11988-12044

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 服务列表中的istio-citadel是Istio的核心安全组件，提供了自动生成、分发、轮换与撤销密钥和证书功能。
> ^8-12560-12617

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 istio-galley并不直接向数据面提供业务能力，而是在控制面上向其他组件提供支持。
> ^8-12978-13022

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 istio-sidecar-injector是负责自动注入的组件，只要开启了自动注入，在Pod创建时就会自动调用istio-sidecar-injector向Pod中注入Sidecar容器。
> ^8-13535-13630

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在本书和Istio的其他文档中，Envoy、Sidecar、Proxy等术语有时混着用，都表示Istio数据面的轻量代理。
> ^8-13953-14014

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 istio-ingressgateway就是入口处的Gateway，从网格外访问网格内的服务就是通过这个Gateway进行的。
> ^8-14989-15052
### 第3章 非侵入的流量治理

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在微服务场景下，负载均衡一般和服务发现配合使用，每个服务都有多个对等的服务实例，需要有一种机制将请求的服务名解析到服务实例地址上。服务发现负责从服务名中解析一组服务实例的列表，负载均衡负责从中选择一个实例。
> ^9-2854-2957

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 不管是SDK的微服务架构，还是Istio这样的ServiceMesh架构，服务发现和负载均衡的工作流程都是类似的，如下所述。
>
>(1)服务注册。各服务将服务名和服务实例的对应信息注册到服务注册中心。
>
>(2)服务发现。在客户端发起服务访问时，以同步或者异步的方式从服务注册中心获取服务对应的实例列表。
>
>(3)负载均衡。根据配置的负载均衡算法从实例列表中选择一个服务实例。
> ^9-3009-3277

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在Istio中，Pilot负责维护服务发现数据。
> ^9-3587-3611

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Istio当前支持的主要负载均衡算法包括：轮询、随机和最小连接数算法。
> ^9-3696-3731

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ◎熔断关闭：熔断器处于关闭状态，服务可以访问。熔断器维护了访问失败的计数器，若服务访问失败则加一。
>
>◎熔断开启：熔断器处于开启状态，服务不可访问，若有服务访问则立即出错。
>
>◎熔断半开启：熔断器处于半开启状态，允许对服务尝试请求，若服务访问成功则说明故障已经得到解决，否则说明故障依然存在。
> ^9-6172-6375

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Istio的连接池管理工作机制对TCP提供了最大连接数、连接超时时间等管理方式，对HTTP提供了最大请求数、最大等待请求数、最大重试次数、每连接最大请求数等管理方式，它控制客户端对目标服务的连接和访问，在超过配置时快速拒绝。
> ^9-9149-9261

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 对于一个系统，尤其是一个复杂的系统，重要的不是故障会不会发生，而是什么时候发生。
> ^9-11611-11651

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 故障处理对于开发人员和测试人员来说都特别耗费时间和精力：对于开发人员来说，他们在开发代码时需要用20%的时间写80%的主要逻辑，然后留出80%的时间处理各种非正常场景；对于测试人员来说，除了需要用80%的时间写20%的异常测试项，更要用超过80%的时间执行这些异常测试项，并构造各种故障场景，尤其是那种理论上才出现的故障，让人苦不堪言。
> ^9-11651-11819

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 1.蓝绿发布
> ^9-13335-13341

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 2.AB测试
> ^9-13677-13683

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 3.金丝雀发布
> ^9-14556-14563

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在Istio中是通过一个ServiceEntry的资源对象将网格外的服务注册到网格上，然后像对网格内的普通服务一样对网格外的服务访问进行治理的。
> ^9-21715-21787

