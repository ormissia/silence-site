---
doc_type: weread-highlights-reviews
bookId: "622000"
reviewCount: 3
noteCount: 87
author: 黄健宏
cover: https://cdn.weread.qq.com/weread/cover/54/YueWen_622000/t6_YueWen_622000.jpg
progress: 100%
readingTime: 4小时53分钟
readingDate: 2024-01-19
finishedDate: 2024-02-19
isbn: 9787111464747
category: 计算机 编程设计
title: Redis设计与实现
rating: 85.8%
readProgress: 100
readingTimestamp: 17580
lastReadDate: 2024-02-19
lastReadTimestamp: 1708334852
tags:
  - 读书笔记
  - 计算机
  - 编程设计
  - 读完
totalWords: 289957

---

# Redis设计与实现

# 元数据
> [!abstract] Redis设计与实现
> - ![ Redis设计与实现|200](https://cdn.weread.qq.com/weread/cover/54/YueWen_622000/t6_YueWen_622000.jpg)
> - 书名： Redis设计与实现
> - 作者： 黄健宏
> - 简介： 《Redis设计与实现》对Redis的大多数单机功能以及所有多机功能的实现原理进行了介绍，展示了这些功能的核心数据结构以及关键的算法思想。通过阅读本书，读者可以快速、有效地了解Redis的内部构造以及运作机制，这些知识可以帮助读者更好、更高效地使用Redis。本书主要分为四大部分。第一部分“数据结构与对象”介绍了Redis中的各种对象及其数据结构，并说明这些数据结构如何影响对象的功能和性能。第二部分“单机数据库的实现”对Redis实现单机数据库的方法进行了介绍，包括数据库、RDB持久化、AOF持久化、事件等。第三部分“多机数据库的实现”对Redis的Sentinel、复制（replication）、集群（cluster）三个多机功能进行了介绍。第四部分“独立功能的实现”对Redis中各个相对独立的功能模块进行了介绍，涉及发布与订阅、事务、Lua脚本、排序、二进制位数组、慢查询日志、监视器等。
> - 出版时间 2015-01-01 00:00:00
> - ISBN： 9787111464747
> - 分类： 计算机-编程设计
> - 出版社： 机械工业出版社


---

# 本书评论

> [!Review] 书评 No.1 
> 虽然示例Redis版本比较老，但是也讲出了Redis的精髓 
> ^439222474-7P6cgUjX4



---

# 高亮划线

### 1.2 章节编排

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis数据库里面的每个键值对（key-valuepair）都是由对象（object）组成
> ^7-535-582
#### 2.1 SDS的定义

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 每个sds.h/sdshdr结构表示一个SDS值：
>
>​​structsdshdr{￼ //记录buf数组中已使用字节的数量￼ //等于SDS所保存字符串的长度￼ intlen;￼ //记录buf数组中未使用字节的数量￼ intfree;￼ //字节数组，用于保存字符串￼ charbuf[];￼ };​​
> ^13-424-621
#### 2.2 SDS与C字符串的区别

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 与C字符串不同，SDS的空间分配策略完全杜绝了发生缓冲区溢出的可能性：当SDSAPI需要对SDS进行修改时，API会先检查SDS的空间是否满足修改所需的要求，如果不满足的话，API会自动将SDS的空间扩展至执行修改所需的大小，然后才执行实际的修改操作，所以使用SDS既不需要手动修改SDS的空间大小，也不会出现前面所说的缓冲区溢出问题。
> ^14-3666-3835

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 通过未使用空间，SDS实现了空间预分配和惰性空间释放两种优化策略。
> ^14-6243-6276

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 空间预分配用于优化SDS的字符串增长操作：当SDS的API对一个SDS进行修改，并且需要对SDS进行空间扩展的时候，程序不仅会为SDS分配修改所必须要的空间，还会为SDS分配额外的未使用空间。
> ^14-6367-6463

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 通过这种预分配策略，SDS将连续增长N次字符串所需的内存重分配次数从必定N次降低为最多N次。
> ^14-8215-8261

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 惰性空间释放用于优化SDS的字符串缩短操作：当SDS的API需要缩短SDS保存的字符串时，程序并不立即使用内存重分配来回收缩短后多出来的字节，而是使用free属性将这些字节的数量记录起来，并等待将来使用。
> ^14-8353-8455

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 注意执行sdstrim之后的SDS并没有释放多出来的8字节空间，而是将这8字节空间作为未使用空间保留在了SDS里面，如果将来要对SDS进行增长操作的话，这些未使用空间就可能会派上用场。
> ^14-9229-9321

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 C字符串中的字符必须符合某种编码（比如ASCII），并且除了字符串的末尾之外，字符串里面不能包含空字符，否则最先被程序读入的空字符将被误认为是字符串结尾
> ^14-10022-10098

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 为了确保Redis可以适用于各种不同的使用场景，SDS的API都是二进制安全的（binary-safe），所有SDSAPI都会以处理二进制的方式来处理SDS存放在buf数组里的数据，程序不会对其中的数据做任何限制、过滤、或者假设，数据在写入时是什么样的，它被读取时就是什么样。
> ^14-10599-10738

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 通过使用二进制安全的SDS，而不是C字符串，使得Redis不仅可以保存文本数据，还可以保存任意格式的二进制数据。
> ^14-11206-11262
### 第3章 链表

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 当一个列表键包含了数量比较多的元素，又或者列表中包含的元素都是比较长的字符串时，Redis就会使用链表作为列表键的底层实现。
> ^18-628-690

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 除了链表键之外，发布与订阅、慢查询、监视器等功能也用到了链表，Redis服务器本身还使用链表来保存多个客户端的状态信息，以及使用链表来构建客户端输出缓冲区（outputbuffer）
> ^18-1025-1117
#### 3.1 链表和链表节点的实现

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 每个链表节点使用一个adlist.h/listNode结构来表示：
>
>​​typedefstructlistNode{￼ //前置节点￼ structlistNode*prev;￼ //后置节点￼ structlistNode*next;￼ //节点的值￼ void*value;￼ }listNode;​​
>
>多个listNode可以通过prev和next指针组成双端链表
> ^19-422-686

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 虽然仅仅使用多个listNode结构就可以组成链表，但使用adlist.h/list来持有链表的话，操作起来会更方便
> ^19-979-1037

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 list结构为链表提供了表头指针head、表尾指针tail，以及链表长度计数器len，而dup、free和match成员则是用于实现多态链表所需的类型特定函数：
>
>❑dup函数用于复制链表节点所保存的值；
>
>❑free函数用于释放链表节点所保存的值；
>
>❑match函数则用于对比链表节点所保存的值和另一个输入值是否相等。
> ^19-1407-1652

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis的链表实现的特性可以总结如下：
>
>❑双端：链表节点带有prev和next指针，获取某个节点的前置节点和后置节点的复杂度都是O（1）。
>
>❑无环：表头节点的prev指针和表尾节点的next指针都指向NULL，对链表的访问以NULL为终点。
>
>❑带表头指针和表尾指针：通过list结构的head指针和tail指针，程序获取链表的表头节点和表尾节点的复杂度为O（1）。
>
>❑带链表长度计数器：程序使用list结构的len属性来对list持有的链表节点进行计数，程序获取链表中节点数量的复杂度为O（1）。
>
>❑多态：链表节点使用void*指针来保存节点值，并且可以通过list结构的dup、free、match三个属性为节点值设置类型特定函数，所以链表可以用于保存各种不同类型的值。
> ^19-2002-2484
#### 3.3 重点回顾

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ❑链表被广泛用于实现Redis的各种功能，比如列表键、发布与订阅、慢查询、监视器等。
> ^21-417-459

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 每个链表节点由一个listNode结构来表示，每个节点都有一个指向前置节点和后置节点的指针，所以Redis的链表实现是双端链表。
> ^21-490-554
### 第4章 字典

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 字典，又称为符号表（symboltable）、关联数组（associativearray）或映射（map），是一种用于保存键值对（key-valuepair）的抽象数据结构。
> ^22-415-505

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis的数据库就是使用字典来作为底层实现的，对数据库的增、删、查、改操作也是构建在对字典的操作之上的。
> ^22-829-882

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 除了用来表示数据库之外，字典还是哈希键的底层实现之一，当一个哈希键包含的键值对比较多，又或者键值对中的元素都是比较长的字符串时，Redis就会使用字典作为哈希键的底层实现。
> ^22-1093-1179
#### 4.1 字典的实现

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis字典所使用的哈希表由dict.h/dictht结构定义：
>
>​​typedefstructdictht{￼ //哈希表数组￼ dictEntry**table;￼ //哈希表大小￼ unsignedlongsize;￼ //哈希表大小掩码，用于计算索引值￼ //总是等于size-1￼ unsignedlongsizemask;￼ //该哈希表已有节点的数量￼ unsignedlongused;￼ }dictht;​​
>
>table属性是一个数组，数组中的每个元素都是一个指向dict.h/dictEntry结构的指针，每个dictEntry结构保存着一个键值对。size属性记录了哈希表的大小，也即是table数组的大小，而used属性则记录了哈希表目前已有节点（键值对）的数量。sizemask属性的值总是等于size-1，这个属性和哈希值一起决定一个键应该被放到table数组的哪个索引上面。
> ^23-632-1124

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 哈希表节点使用dictEntry结构表示，每个dictEntry结构都保存着一个键值对：
>
>​​typedefstructdictEntry{￼ //键￼ void*key;￼ //值￼ union{￼ void*val;￼ uint64_tu64;￼ int64_ts64;￼ }v;￼ //指向下个哈希表节点，形成链表￼ structdictEntry*next;￼ }dictEntry;​​
>
>key属性保存着键值对中的键，而v属性则保存着键值对中的值，其中键值对的值可以是一个指针，或者是一个uint64_t整数，又或者是一个int64_t整数。
>
>next属性是指向另一个哈希表节点的指针，这个指针可以将多个哈希值相同的键值对连接在一次，以此来解决键冲突（collision）的问题。
> ^23-1518-1994

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis中的字典由dict.h/dict结构表示：
>
>​​typedefstructdict{￼ //类型特定函数￼ dictType*type;￼ //私有数据￼ void*privdata;￼ //哈希表￼ dicththt[2];￼ //rehash索引￼ //当rehash不在进行时，值为-1￼ intrehashidx;/*rehashingnotinprogressifrehashidx==-1*/￼ }dict;​​
>
>type属性和privdata属性是针对不同类型的键值对，为创建多态字典而设置的：
>
>❑type属性是一个指向dictType结构的指针，每个dictType结构保存了一簇用于操作特定类型键值对的函数，Redis会为用途不同的字典设置不同的类型特定函数。
>
>❑而privdata属性则保存了需要传给那些类型特定函数的可选参数。
>
>​​typedefstructdictType{￼ //计算哈希值的函数￼ unsignedint(*hashFunction)(constvoid*key);￼ //复制键的函数￼ void*(*keyDup)(void*privdata,constvoid*key);￼ //复制值的函数￼ void*(*valDup)(void*privdata,constvoid*obj);￼ //对比键的函数￼ int(*keyCompare)(void*privdata,constvoid*key1,constvoid*key2);￼ //销毁键的函数￼ void(*keyDestructor)(void*privdata,void*key);￼ //销毁值的函数￼ void(*valDestructor)(void*privdata,void*obj);￼ }dictType;​​
>
>ht属性是一个包含两个项的数组，数组中的每个项都是一个dictht哈希表，一般情况下，字典只使用ht[0]哈希表，ht[1]哈希表只会在对ht[0]哈希表进行rehash时使用。
>
>除了ht[1]之外，另一个和rehash有关的属性就是rehashidx，它记录了rehash目前的进度，如果目前没有在进行rehash，那么它的值为-1。
> ^23-2407-3657
#### 4.2 哈希算法

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 当要将一个新的键值对添加到字典里面时，程序需要先根据键值对的键计算出哈希值和索引值，然后再根据索引值，将包含新键值对的哈希表节点放到哈希表数组的指定索引上面。
> ^24-416-495

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis使用MurmurHash2算法来计算键的哈希值。
> ^24-1662-1720

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 MurmurHash算法最初由AustinAppleby于2008年发明，这种算法的优点在于，即使输入的键是有规律的，算法仍能给出一个很好的随机分布性，并且算法的计算速度也非常快。
> ^24-1720-1811
#### 4.3 解决键冲突

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis的哈希表使用链地址法（separatechaining）来解决键冲突，每个哈希表节点都有一个next指针，多个哈希表节点可以用next指针构成一个单向链表，被分配到同一个索引上的多个节点可以用这个单向链表连接起来，这就解决了键冲突的问题。
> ^25-500-625
#### 4.4 rehash

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis对字典的哈希表执行rehash的步骤如下：
>
>1）为字典的ht[1]哈希表分配空间，这个哈希表的空间大小取决于要执行的操作，以及ht[0]当前包含的键值对数量（也即是ht[0].used属性的值）：
>
>❑如果执行的是扩展操作，那么ht[1]的大小为第一个大于等于ht[0].used*2的2n（2的n次方幂）；
>
>❑如果执行的是收缩操作，那么ht[1]的大小为第一个大于等于ht[0].used的2n。
>
>2）将保存在ht[0]中的所有键值对rehash到ht[1]上面：rehash指的是重新计算键的哈希值和索引值，然后将键值对放置到ht[1]哈希表的指定位置上。
>
>3）当ht[0]包含的所有键值对都迁移到了ht[1]之后（ht[0]变为空表），释放ht[0]，将ht[1]设置为ht[0]，并在ht[1]新创建一个空白哈希表，为下一次rehash做准备。
> ^26-592-1116

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 当以下条件中的任意一个被满足时，程序会自动开始对哈希表执行扩展操作：
>
>1）服务器目前没有在执行BGSAVE命令或者BGREWRITEAOF命令，并且哈希表的负载因子大于等于1。
>
>2）服务器目前正在执行BGSAVE命令或者BGREWRITEAOF命令，并且哈希表的负载因子大于等于5。
> ^26-2586-2783

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 哈希表的负载因子可以通过公式：
>
>​​#负载因子=哈希表已保存节点数量/哈希表大小￼ load_factor=ht[0].used/ht[0].size​​
> ^26-2814-2907

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 根据BGSAVE命令或BGREWRITEAOF命令是否正在执行，服务器执行扩展操作所需的负载因子并不相同，这是因为在执行BGSAVE命令或BGREWRITEAOF命令的过程中，Redis需要创建当前服务器进程的子进程，而大多数操作系统都采用写时复制（copy-on-write）技术来优化子进程的使用效率，所以在子进程存在期间，服务器会提高执行扩展操作所需的负载因子，从而尽可能地避免在子进程存在期间进行哈希表扩展操作，这可以避免不必要的内存写入操作，最大限度地节约内存。
> ^26-3201-3437

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 当哈希表的负载因子小于0.1时，程序自动开始对哈希表执行收缩操作。
> ^26-3471-3504
#### 4.5 渐进式rehash

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 为了避免rehash对服务器性能造成影响，服务器不是一次性将ht[0]里面的所有键值对全部rehash到ht[1]，而是分多次、渐进式地将ht[0]里面的键值对慢慢地rehash到ht[1]。
> ^27-722-818

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 哈希表渐进式rehash的详细步骤：
>
>1）为ht[1]分配空间，让字典同时持有ht[0]和ht[1]两个哈希表。
>
>2）在字典中维持一个索引计数器变量rehashidx，并将它的值设置为0，表示rehash工作正式开始。
>
>3）在rehash进行期间，每次对字典执行添加、删除、查找或者更新操作时，程序除了执行指定的操作以外，还会顺带将ht[0]哈希表在rehashidx索引上的所有键值对rehash到ht[1]，当rehash工作完成之后，程序将rehashidx属性的值增一。
>
>4）随着字典操作的不断执行，最终在某个时间点上，ht[0]的所有键值对都会被rehash至ht[1]，这时程序将rehashidx属性的值设为-1，表示rehash操作已完成。
> ^27-850-1290

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 因为在进行渐进式rehash的过程中，字典会同时使用ht[0]和ht[1]两个哈希表，所以在渐进式rehash进行期间，字典的删除（delete）、查找（find）、更新（update）等操作会在两个哈希表上进行。例如，要在字典里面查找一个键的话，程序会先在ht[0]里面进行查找，如果没找到的话，就会继续到ht[1]里面进行查找，诸如此类。
>
>另外，在渐进式rehash执行期间，新添加到字典的键值对一律会被保存到ht[1]里面，而ht[0]则不再进行任何添加操作，这一措施保证了ht[0]包含的键值对数量会只减不增，并随着rehash操作的执行而最终变成空表。
> ^27-3080-3389
#### 4.7 重点回顾

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis中的字典使用哈希表作为底层实现，每个字典带有两个哈希表，一个平时使用，另一个仅在进行rehash时使用。
> ^29-481-538
### 第5章 跳跃表

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 跳跃表支持平均O（logN）、最坏O（N）复杂度的节点查找，还可以通过顺序性操作来批量处理节点。
> ^30-506-554

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在大部分情况下，跳跃表的效率可以和平衡树相媲美，并且因为跳跃表的实现比平衡树要来得更为简单，所以有不少程序都使用跳跃表来代替平衡树。
> ^30-583-649

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis只在两个地方用到了跳跃表，一个是实现有序集合键，另一个是在集群节点中用作内部数据结构
> ^30-1376-1423
#### 5.1 跳跃表的实现

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis的跳跃表由redis.h/zskiplistNode和redis.h/zskiplist两个结构定义，其中zskiplistNode结构用于表示跳跃表节点，而zskiplist结构则用于保存跳跃表节点的相关信息，比如节点的数量，以及指向表头节点和表尾节点的指针等等。
> ^31-419-557
### 第6章 整数集合

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 整数集合（intset）是集合键的底层实现之一，当一个集合只包含整数值元素，并且这个集合的元素数量不多时，Redis就会使用整数集合作为集合键的底层实现。
> ^34-419-496
#### 6.1 整数集合的实现

> [!Annotation]+ <span style="color: #ffce78;">Annotation</span>
> 📌 整数集合（intset）是Redis用于保存整数值的集合抽象数据结构，它可以保存类型为int16_t、int32_t或者int64_t的整数值，并且保证集合中不会出现重复元素。
> ---
> 当存储元素较少时（小于512个）时使用，实现就是数组加编码，查找复杂度O(n)。相比于红黑树、二叉树大大减少内存。 

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 每个intset.h/intset结构表示一个整数集合：
>
>​​typedefstructintset{￼ //编码方式￼ uint32_tencoding;￼ //集合包含的元素数量￼ uint32_tlength;￼ //保存元素的数组￼ int8_tcontents[];￼ }intset;​​
>
>contents数组是整数集合的底层实现：整数集合的每个元素都是contents数组的一个数组项（item），各个项在数组中按值的大小从小到大有序地排列，并且数组中不包含任何重复项。
>
>length属性记录了整数集合包含的元素数量，也即是contents数组的长度。
> ^35-538-922

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 虽然intset结构将contents属性声明为int8_t类型的数组，但实际上contents数组并不保存任何int8_t类型的值，contents数组的真正类型取决于encoding属性的值：
>
>❑如果encoding属性的值为INTSET_ENC_INT16，那么contents就是一个int16_t类型的数组，数组里的每个项都是一个int16_t类型的整数值（最小值为-32768，最大值为32767）。
>
>❑如果encoding属性的值为INTSET_ENC_INT32，那么contents就是一个int32_t类型的数组，数组里的每个项都是一个int32_t类型的整数值（最小值为-2147483648，最大值为2147483647）。
>
>❑如果encoding属性的值为INTSET_ENC_INT64，那么contents就是一个int64_t类型的数组，数组里的每个项都是一个int64_t类型的整数值（最小值为-9223372036854775808，最大值为9223372036854775807）。
> ^35-951-1498
#### 6.2 升级

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 每当我们要将一个新元素添加到整数集合里面，并且新元素的类型比整数集合现有所有元素的类型都要长时，整数集合需要先进行升级（upgrade），然后才能将新元素添加到整数集合里面。
> ^36-416-503

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 升级整数集合并添加新元素共分为三步进行：
>
>1）根据新元素的类型，扩展整数集合底层数组的空间大小，并为新元素分配空间。
>
>2）将底层数组现有的所有元素都转换成与新元素相同的类型，并将类型转换后的元素放置到正确的位上，而且在放置元素的过程中，需要继续维持底层数组的有序性质不变。
>
>3）将新元素添加到底层数组里面。
> ^36-532-769

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 因为每次向整数集合添加新元素都可能会引起升级，而每次升级都需要对底层数组中已有的所有元素进行类型转换，所以向整数集合添加新元素的时间复杂度为O（N）。
> ^36-4074-4149
#### 6.4 降级

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 整数集合不支持降级操作，一旦对数组进行了升级，编码就会一直保持升级后的状态。
> ^38-416-454
### 第7章 压缩列表

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 压缩列表（ziplist）是列表键和哈希键的底层实现之一。当一个列表键只包含少量列表项，并且每个列表项要么就是小整数值，要么就是长度比较短的字符串，那么Redis就会使用压缩列表来做列表键的底层实现。
> ^41-419-519

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 当一个哈希键只包含少量键值对，比且每个键值对的键和值要么就是小整数值，要么就是长度比较短的字符串，那么Redis就会使用压缩列表来做哈希键的底层实现。
> ^41-802-877
#### 7.1 压缩列表的构成

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 压缩列表是Redis为了节约内存而开发的，是由一系列特殊编码的连续内存块组成的顺序型（sequential）数据结构。一个压缩列表可以包含任意多个节点（entry），每个节点可以保存一个字节数组或者一个整数值。
> ^42-421-526
#### 7.2 压缩列表节点的构成

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 每个压缩列表节点可以保存一个字节数组或者一个整数值
> ^43-423-448

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 节点的previous_entry_length属性以字节为单位，记录了压缩列表中前一个节点的长度。previous_entry_length属性的长度可以是1字节或者5字节：
>
>❑如果前一节点的长度小于254字节，那么previous_entry_length属性的长度为1字节：前一节点的长度就保存在这一个字节里面。
>
>❑如果前一节点的长度大于等于254字节，那么previous_entry_length属性的长度为5字节：其中属性的第一字节会被设置为0xFE（十进制值254），而之后的四个字节则用于保存前一节点的长度。
> ^43-1454-1774

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 因为节点的previous_entry_length属性记录了前一个节点的长度，所以程序可以通过指针运算，根据当前节点的起始地址来计算出前一个节点的起始地址。
> ^43-2587-2666

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 节点的encoding属性记录了节点的content属性所保存数据的类型以及长度：
>
>❑一字节、两字节或者五字节长，值的最高位为00、01或者10的是字节数组编码：这种编码表示节点的content属性保存着字节数组，数组的长度由编码除去最高两位之后的其他位记录；
>
>❑一字节长，值的最高位以11开头的是整数编码：这种编码表示节点的content属性保存着整数值，整数值的类型和长度由编码除去最高两位之后的其他位记录；
> ^43-4093-4357
#### 7.3 连锁更新

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis将这种在特殊情况下产生的连续多次空间扩展操作称之为“连锁更新”（cascadeupdate）
> ^44-2110-2162

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 因为连锁更新在最坏情况下需要对压缩列表执行N次空间重分配操作，而每次空间重分配的最坏复杂度为O（N），所以连锁更新的最坏复杂度为O（N2）。
> ^44-3023-3094
### 第8章 对象

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis的对象系统还实现了基于引用计数技术的内存回收机制，当程序不再使用某个对象的时候，这个对象所占用的内存就会被自动释放；另外，Redis还通过引用计数技术实现了对象共享机制，这一机制可以在适当的条件下，通过让多个数据库键共享同一个对象来节约内存。
> ^47-806-932

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在服务器启用了maxmemory功能的情况下，空转时长较大的那些键可能会优先被服务器删除。
> ^47-1002-1047
#### 8.1 对象的类型与编码

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis使用对象来表示数据库中的键和值，每次当我们在Redis的数据库中新创建一个键值对时，我们至少会创建两个对象，一个对象用作键值对的键（键对象），另一个对象用作键值对的值（值对象）。
> ^48-420-514

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis中的每个对象都由一个redisObject结构表示，该结构中和保存数据有关的三个属性分别是type属性、encoding属性和ptr属性：
> ^48-711-785

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 对于Redis数据库保存的键值对来说，键总是一个字符串对象，而值则可以是字符串对象、列表对象、哈希对象、集合对象或者有序集合对象的其中一种
> ^48-1336-1405
#### 8.2 字符串对象

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 字符串对象的编码可以是int、raw或者embstr。
> ^49-417-444

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 因为Redis没有为embstr编码的字符串对象编写任何相应的修改程序（只有int编码的字符串对象和raw编码的字符串对象有这些程序），所以embstr编码的字符串对象实际上是只读的。当我们对embstr编码的字符串对象执行任何修改命令时，程序会先将对象的编码从embstr转换成raw，然后再执行修改命令。因为这个原因，embstr编码的字符串对象在执行修改命令之后，总会变成一个raw编码的字符串对象。
> ^49-4543-4746
#### 8.4 哈希对象

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 哈希对象的编码可以是ziplist或者hashtable。
> ^51-416-445

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ziplist编码的哈希对象使用压缩列表作为底层实现，每当有新的键值对要加入到哈希对象时，程序会先将保存了键的压缩列表节点推入到压缩列表表尾，然后再将保存了值的压缩列表节点推入到压缩列表表尾
> ^51-474-569
#### 8.5 集合对象

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 集合对象的编码可以是intset或者hashtable。
> ^52-416-444

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 hashtable编码的集合对象使用字典作为底层实现，字典的每个键都是一个字符串对象，每个字符串对象包含了一个集合元素，而字典的值则全部被设置为NULL。
> ^52-678-755
#### 8.6 有序集合对象

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 有序集合的编码可以是ziplist或者skiplist。
> ^53-418-446

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 skiplist编码的有序集合对象使用zset结构作为底层实现，一个zset结构同时包含一个字典和一个跳跃表
> ^53-1204-1258
#### 8.7 类型检查与命令多态

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 类型特定命令所进行的类型检查是通过redisObject结构的type属性来实现的
> ^54-1828-1869

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 DEL、EXPIRE等命令和LLEN等命令的区别在于，前者是基于类型的多态——一个命令可以同时用于处理多种不同类型的键，而后者是基于编码的多态——一个命令可以同时用于处理多种不同编码。
> ^54-3522-3614
#### 8.8 内存回收

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 因为C语言并不具备自动内存回收功能，所以Redis在自己的对象系统中构建了一个引用计数（referencecounting）技术实现的内存回收机制，通过这一机制，程序可以通过跟踪对象的引用计数信息，在适当的时候自动释放对象并进行内存回收。
> ^55-416-536
#### 8.9 对象共享

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在Redis中，让多个键共享同一个值对象需要执行以下两个步骤：
>
>1）将数据库键的值指针指向一个现有的值对象；
>
>2）将被共享的值对象的引用计数增一。
> ^56-756-885

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 目前来说，Redis会在初始化服务器时，创建一万个字符串对象，这些对象包含了从0到9999的所有整数值，当服务器需要用到值为0到9999的字符串对象时，服务器就会使用这些共享对象，而不是新创建对象。
> ^56-1683-1782
#### 8.10 对象的空转时长

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 除了前面介绍过的type、encoding、ptr和refcount四个属性之外，redisObject结构包含的最后一个属性为lru属性，该属性记录了对象最后一次被命令程序访问的时间
> ^57-420-512
#### 15.2 旧版复制功能的缺陷

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 SYNC命令是一个非常耗费资源的操作
> ^100-1911-1929
#### 18.1 频道的订阅与退订

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis将所有频道的订阅关系都保存在服务器状态的pubsub_channels字典里面，这个字典的键是某个被订阅的频道，而键的值则是一个链表，链表里面记录了所有订阅这个频道的客户端
> ^130-513-604
### 第19章 事务

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Redis通过MULTI、EXEC、WATCH等命令来实现事务（transaction）功能。事务提供了一种将多个命令请求打包，然后一次性、按顺序地执行多个命令的机制，并且在事务执行期间，服务器不会中断事务而改去执行其他客户端的命令请求，它会将事务中的所有命令都执行完毕，然后才去处理其他客户端的命令请求。
> ^136-417-570
#### 19.1 事务的实现

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 一个事务从开始到结束通常会经历以下三个阶段：
>
>1）事务开始。
>
>2）命令入队。
>
>3）事务执行。
> ^137-419-549
#### 20.1 创建并修改Lua环境

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 所以在任何特定时间里，最多都只会有一个脚本能够被放进Lua环境里面运行，因此，整个Redis服务器只需要创建一个Lua环境即可。
> ^143-9104-9168
#### 21.3 ASC选项和DESC选项的实现

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 升序排序和降序排序都由相同的快速排序算法执行
> ^154-1086-1108
#### 21.9 多个选项的执行顺序

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 调用SORT命令时，除了GET选项之外，改变选项的摆放顺序并不会影响SORT命令执行这些选项的顺序。
> ^160-1837-1887
### 第23章 慢查询日志

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 使用SLOWLOGGET命令查看服务器所保存的慢查询日志
> ^170-1531-1560
#### 24.3 重点回顾

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 客户端可以通过执行MONITOR命令，将客户端转换成监视器，接收并打印服务器处理的每个命令请求的相关信息。
> ^178-421-474
# 读书笔记

### 6.1 整数集合的实现

> [!Annotation]+ <span style="color: ;">Annotation</span>
> 📌 整数集合（intset）是Redis用于保存整数值的集合抽象数据结构，它可以保存类型为int16_t、int32_t或者int64_t的整数值，并且保证集合中不会出现重复元素。 
> ^439222474-7P4uzxDIt
> ---
> 💭 当存储元素较少时（小于512个）时使用，实现就是数组加编码，查找复杂度O(n)。相比于红黑树、二叉树大大减少内存。 

### 8.3 列表对象

> [!Annotation]+ <span style="color: ;">Annotation</span>
> 📌 编码 
> ^439222474-7P4DcEQY1
> ---
> 💭 在Redis3.2之后，统一用quicklist来存储列表对象，quicklist存储了一个双向列表，每个列表的节点是一个ziplist，所以实际上quicklist就是linkedlist和ziplist的结合。
