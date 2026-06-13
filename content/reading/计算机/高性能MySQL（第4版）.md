---
doc_type: weread-highlights-reviews
bookId: "3300035678"
title: 高性能MySQL（第4版）
reviewCount: 1
noteCount: 53
author: Silvia Botros   Jeremy Tinley
cover: https://cdn.weread.qq.com/weread/cover/5/cpPlatform_tpeiJyaZriAkSeauDycVY8/t6_cpPlatform_tpeiJyaZriAkSeauDycVY8.jpg
readingStatus: "4"
progress: 100%
readingTime: 28小时18分钟
readingDate: 2023-12-12
finishedDate: 2024-09-02
isbn: 9787121442575
category: 计算机 数据库
rating: 72.7%
readProgress: 100
readingTimestamp: 101884
lastReadDate: 2024-01-18
lastReadTimestamp: 1725276794
tags:
  - 读书笔记
  - 计算机
  - 数据库
  - 读完
totalWords:

---

# 高性能MySQL（第4版）

# 元数据
> [!abstract] 高性能MySQL（第4版）
> - ![ 高性能MySQL（第4版）|200](https://cdn.weread.qq.com/weread/cover/5/cpPlatform_tpeiJyaZriAkSeauDycVY8/t6_cpPlatform_tpeiJyaZriAkSeauDycVY8.jpg)
> - 书名： 高性能MySQL（第4版）
> - 作者： Silvia Botros   Jeremy Tinley
> - 简介： 《高性能 MySQL》一直是 MySQL 领域的经典之作，影响了一代又一代的 DBA 和技术人员，从第3 版出版到第 4 版出版过去了近十年，MySQL 也从 5.5 版本更新到了 8.0 版本。第 4 版中增加了大量对 MySQL 5.7 和 8.0 版本新特性的介绍，删除了一些在新版本中已经废弃或者不再常用的功能，还增加了对云数据库的介绍，减少了在官方文档中已有的基础使用和配置相关的内容。这些年，MySQL 经过在大量大规模互联网场景中的应用验证，使得本书在继续关注高性能之外，还用了较多的篇幅来介绍如何实现 MySQL 的大规模可扩展应用和合规性问题，这是相比第 3 版最大的不同，也是本书封面上所写的“经过大规模运维验证的策略”的体现。本书适合数据库管理员（DBA）阅读，也适合系统运维和开发人员参考学习。不管你是数据库新手还是专家，相信都能从本书中有所收获。
> - 出版时间 2022-09-01 00:00:00
> - ISBN： 9787121442575
> - 分类： 计算机-数据库
> - 出版社： 电子工业出版社



---

# 高亮划线

## 第6章 schema设计与管理

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 DATETIME和TIMESAMP列可以存储相同类型的数据：时间和日期，精确到秒。然而TIMESTAMP只使用DATETIME一半的存储空间，还会根据时区变化，而且具有特殊的自动更新能力。另一方面，TIMESTAMP允许的时间范围要小得多，有时候它的特殊能力会成为障碍。
> ^16-2521-2656

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 MySQL可以为整数类型指定宽度，例如，INT(11)，这对大多数应用毫无意义：它不会限制值的合法范围，只是规定了MySQL的一些交互工具（例如，MySQL命令行客户端）用来显示字符的个数。对于存储和计算来说，INT(1)和INT(20)是相同的。
> ^16-3741-3865

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在一些大容量的场景，可以考虑使用BIGINT代替DECIMAL，将需要存储的货币单位根据小数的位数乘以相应的倍数即可。假设要存储财务数据并精确到万分之一分，则可以把所有金额乘以一百万，然后将结果存储在BIGINT里，这样可以同时避免浮点存储计算不精确和DECIMAL精确计算代价高的问题。
> ^16-4511-4655

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 CHAR适合存储非常短的字符串，或者适用于所有值的长度都几乎相同的情况
> ^16-6006-6041

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 MySQL不能将BLOB和TEXT数据类型的完整字符串放入索引，也不能使用索引进行排序。
> ^16-8643-8687

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 对于完全“随机”的字符串要非常小心，如MD5()、SHA1()或UUID()生成的字符串。这些函数生成的新值会任意分布在很大的空间内，这会减慢INSERT和某些类型的SELECT查询的速度：
> ^16-23460-23660

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 如果存储通用唯一标识符(UUID)值，则应该删除破折号，或者更好的做法是，使用UNHEX()函数将UUID值转换为16字节的数字，并将其存储在一个BINARY(16)列中。可以使用HEX()函数以十六进制格式检索值。
> ^16-24001-24109

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 MySQL提供了INET_ATON()和INET_NTOA()函数来在这两种表示形式之间进行转换。使用的空间从VARCHAR(15)的约16字节缩减到无符号32位整数的4字节。如果你担心数据库的可读性，不想继续使用函数查看行数据，请记住MySQL有视图，可以使用视图来简化数据查看的复杂性。
> ^16-25001-25146

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 即使需要在表中存储事实上的“空值”，也可能不需要使用NULL。也许可以使用0、特殊值或空字符串作为代替。
> ^16-27090-27142
## 第7章 创建高性能的索引

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在MySQL中，索引是在存储引擎层而不是服务器层实现的
> ^17-2261-2288

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 InnoDB则使用的是B+tree
> ^17-3003-3020

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 自适应哈希索引。InnoDB存储引擎有一个被称为自适应哈希索引的特性。当InnoDB发现某些索引值被非常频繁地被访问时，它会在原有的B-tree索引之上，在内存中再构建一个哈希索引。
> ^17-4702-4793

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 B-tree索引通常可以支持“只访问索引的查询”，即查询只需要访问索引，而无须访问数据行。后面我们将单独讨论这种“覆盖索引”的优化。
> ^17-5844-5910

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 ●索引大大减少了服务器需要扫描的数据量。
>
>●索引可以帮助服务器避免排序和临时表。
>
>●索引可以将随机I/O变为顺序I/O。
> ^17-7486-7602

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 “三星系统”(three-starsystem)评价体系，用以判断一个索引是不是适合某个查询语句：索引将相关的记录放到一起则获得“一星”；如果索引中的数据顺序和查找中的排列顺序一致则获得“二星”；如果索引中的列包含了查询中需要的全部列则获得“三星”。
> ^17-7897-8023

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 有时候为了提升索引的性能，同时也节省索引空间，可以只对字段的前一部分字符进行索引，这样做的缺点是，会降低索引的选择性。索引的选择性是指，不重复的索引值（也称为基数，cardinality）和数据表的记录总数(＃T)的比值，范围从1/＃T到1之间。索引的选择性越高则查询效率越高
> ^17-8636-8774

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 对于BLOB、TEXT或者很长的VARCHAR类型的列，必须使用前缀索引，因为MySQL并不支持对这些列的完整内容进行索引。
> ^17-8892-8954

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 查询显示，当前缀长度到达7的时候，再增加前缀长度，选择性提升的幅度已经很小了。
> ^17-11189-11228

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 MySQL无法使用前缀索引做ORDERBY和GROUPBY操作，也无法使用前缀索引做覆盖扫描。
> ^17-12081-12130

> [!Annotation]+ <span style="color: #ffce78;">Annotation</span>
> 📌 使用UNION改写查询，往往是最好的办法。
> ---
> And条件使用联合索引，or条件建议使用union

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 如果在EXPLAIN中看到有索引合并，那么就应该好好检查一下查询语句的写法和表的结构，看是不是已经是最优的。
> ^17-14112-14166

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 聚簇索引￼并不是一种单独的索引类型，而是一种数据存储方式。具体的细节依赖于其实现方式，但InnoDB的聚簇索引实际上在同一个结构中保存了B-tree索引和数据行。
> ^17-18727-18929

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 术语“聚簇”表示数据行和相邻的键值紧凑地存储在一起。
> ^17-18997-19102

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 InnoDB根据主键聚簇数据
> ^17-19714-19728

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 如果你没有定义主键，InnoDB会选择一个唯一的非空索引代替。如果没有这样的索引，InnoDB会隐式定义一个主键来作为聚簇索引。
> ^17-19781-19845

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 二级索引中保存的是“行指针”。
> ^17-21017-21032

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 二级索引叶子节点保存的不是指向行的物理位置的指针，而是行的主键值。
> ^17-21036-21069

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 聚簇索引的每一个叶子节点都包含了主键值、事务ID、用于事务和MVCC的回滚指针，以及所有的剩余列（在这个例子中是col2）
> ^17-22417-22478

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 最好避免随机的（不连续且值的分布范围非常大）聚簇索引，特别是对于I/O密集型的应用。例如，从性能的角度考虑，使用UUID作为聚簇索引会很糟糕：它使得聚簇索引的插入变得完全随机，这就是最糟糕的情况，数据本身没有任何聚集特性。
> ^17-23415-23526

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 注意，向UUID主键插入行不仅花费的时间更长，而且索引占用的空间也更大。一方面是由于主键字段更长；另一方面，无疑是由于页分裂和碎片导致的。
> ^17-24872-24941

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 当达到页的最大填充因子时（InnoDB默认的最大填充因子是页大小的15/16，留出部分空间用于以后修改），下一条记录就会被写入新的页中
> ^17-25381-25448

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 对于高并发的工作负载，在InnoDB中按主键顺序插入可能会造成明显的写入竞争。主键的上界会成为“热点”。因为所有的插入都发生在这里，所以并发插入可能导致间隙锁竞争。另一个热点可能是AUTO_INCREMENT锁机制；如果遇到这个问题，则可能需要考虑重新设计表或者应用，或者更改innodb_autoinc_lock_mode配置。如果你的服务器版本还不支持innodb_autoinc_lock_mode参数，可以将其升级到新版本的InnoDB，该版本对这种场景会适应得更好。
> ^17-26523-26761

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 如果一个索引包含（或者说覆盖）所有需要查询的字段的值，我们就称之为覆盖索引。需要注意的是，只有B-tree索引可以用于覆盖索引。
> ^17-27036-27100

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 覆盖索引是非常有用的工具，能够极大地提高性能。试想一下，如果查询只需要扫描索引而无须回表，会带来多少好处：
>
>●索引条目通常远小于数据行大小，所以如果只需要读取索引，那么MySQL就会极大地减少数据访问量。这对缓存型的应用负载非常重要，因为在这种情况下，响应时间大部分花费在数据拷贝上。覆盖索引对于I/O密集型的应用也有帮助，因为索引比数据更小，更容易全部放入内存中。
>
>●因为索引是按照列值的顺序存储的（至少在单页内如此），所以对于I/O密集型的范围查询会比随机从磁盘读取每一行数据的I/O要少得多。可以通过OPTIMIZE命令使得索引完全实现顺序排列，这让简单的范围查询能使用完全顺序的索引访问。
>
>●由于InnoDB的聚簇索引的特点，覆盖索引对InnoDB表特别有用。InnoDB的二级索引在叶子节点中保存了记录的主键值，所以如果二级索引能够覆盖查询，则可以避免对主键索引的二次查询。
> ^17-27129-27605

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 但如果索引不能覆盖查询所需的全部列，那么就不得不每扫描一条索引记录都回表查询一次对应的记录。这基本上都是随机I/O，因此按索引顺序读取数据的速度通常要比顺序地全表扫描慢，尤其是在I/O密集型的应用负载上。
> ^17-29205-29307

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 只有当索引的顺序和ORDERBY子句的顺序完全一致，并且所有列的排序方向（倒序或正序）都一样时，MySQL才能使用索引来对结果做排序。￼如果查询需要联接多张表，则只有当ORDERBY子句引用的字段全部在第一个表中时，才能使用索引做排序。ORDERBY子句和查找型查询的限制是一样的：需要满足索引的最左前缀的要求，否则，MySQL需要执行排序操作，而无法利用索引排序。
> ^17-29428-29711

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 即使ORDERBY子句不满足索引的最左前缀的要求，也可以用于查询排序，这正是因为索引的第一列被指定为了一个常数。
> ^17-30807-30864

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 MySQL的唯一限制和主键限制都是通过索引实现的
> ^17-34070-34094

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 对于上述的两种情况，都可以考虑使用MySQL8.0的不可见索引特性，而不是直接删除索引。要使用这个特性，可以通过ALTERTABLE语句，改变索引的一个标志位，使得优化器在确定执行计划时，忽略该索引。如果你发现计划删除的索引依旧有非常重要的作用，可以直接把索引改成可见，而不需要重新构建该索引。
> ^17-37791-37940

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 找到未使用索引的最好办法就是使用系统数据库performance_schema和sys。在sys数据库中，在table_io_waits_summary_by_index_usage视图中可以非常简单地知道哪些索引从来没有被使用过
> ^17-38248-38363

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 表的数据存储也可能发生碎片化。然而，数据存储的碎片化比索引更加复杂。有三种类型的数据碎片。
>
>行碎片(Rowfragmentation)
>
>这种碎片指的是数据行被存储在多个地方的多个片段中。即使查询只从索引中访问一行记录，行碎片也会导致性能下降。
>
>行间碎片(Intra-rowfragmentation)
>
>行间碎片是指逻辑上顺序的页或者行，在磁盘上不是顺序存储的。行间碎片对诸如全表扫描和聚簇索引扫描之类的操作有很大的影响，因为这些操作原本能够从磁盘上顺序存储的数据中获益。
>
>剩余空间碎片(Freespacefragmentation)
>
>剩余空间碎片是指数据页中有大量的空余空间。这会导致服务器读取大量不需要的数据，从而造成浪费。
> ^17-41997-42566
## 第8章 查询性能优化

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 查询优化、索引优化、库表结构优化
> ^18-588-604

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 查询的生命周期大致可以按照如下顺序来看：从客户端到服务器，然后在服务器上进行语法解析，生成执行计划，执行，并给客户端返回结果。其中，“执行”可以被认为是整个生命周期中最重要的阶段，这其中包括大量为了检索数据对存储引擎的调用以及调用后的数据处理，包括排序、分组等。
> ^18-1305-1436

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 对于低效的查询，我们发现通过下面两个步骤来分析总是很有效：
>
>1.确认应用程序是否在检索大量且不必要的数据。这通常意味着访问了太多的行，但有时候也可能是访问了太多的列。
>
>2.确认MySQL服务器层是否在分析大量不需要的数据行。
> ^18-2054-2222

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 响应时间是两部分之和：服务时间和排队时间。服务时间是指数据库处理这个查询真正花了多长时间。排队时间是指服务器因为等待某些资源而没有真正执行查询的时间——可能是等I/O操作完成，也可能是等待行锁，等等。
> ^18-4792-4892

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 删除旧的数据就是一个很好的例子。定期清除大量数据时，如果用一个大的语句一次性完成的话，则可能需要一次锁住很多数据、占满整个事务日志、耗尽系统资源、阻塞很多小的但重要的查询。将一个大的DELETE语句切分成多个较小的查询可以尽可能小地影响MySQL的性能，同时还可以降低MySQL复制的延迟。
> ^18-10587-10732

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 当向MySQL发送一个请求的时候，MySQL到底做了些什么：
>
>1.客户端给服务器发送一条SQL查询语句。
>
>2.服务器端进行SQL语句解析、预处理，再由优化器生成对应的执行计划。
>
>3.MySQL根据优化器生成的执行计划，调用存储引擎的API来执行查询。
>
>4.将结果返回给客户端。
> ^18-13152-13403

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 MySQL的客户端和服务器之间的通信协议是“半双工”的，这意味着，在任何时刻，要么是由服务器向客户端发送数据，要么是由客户端向服务器发送数据，这两个动作不能同时发生。
> ^18-13979-14062

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Sleep
>
>线程正在等待客户端发送新的请求。
>
>Query
>
>线程正在执行查询或者正在将结果发送给客户端。
>
>Locked
>
>在MySQL服务器层，该线程正在等待表锁。在存储引擎级别实现的锁，例如InnoDB的行锁，并不会体现在线程状态中。
>
>Analyzingandstatistics
>
>线程正在检查存储引擎的统计信息，并优化查询。
>
>Copyingtotmptable[ondisk]
>
>线程正在执行查询，并且将其结果集复制到一个临时表中，这种状态一般要么是在做GROUPBY操作，要么是在进行文件排序操作，或者是在进行UNION操作。如果这个状态后面还有“ondisk”标记，那表示MySQL正在将一个内存临时表放到磁盘上。
>
>Sortingresult
>
>线程正在对结果集进行排序。
>
>了解这些状态的基本含义非常有用，这可以让你很快地了解当前“谁正在持球”。在一个繁忙的服务器上，可能会看到大量的不正常的状态，例如，statistics正占用大量的时间。这通常表示，某个地方有异常了。
> ^18-17281-18210

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 MySQL从不考虑其他并发执行的查询，这可能会影响到当前查询的速度。
> ^18-20216-20250

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在发现已经满足查询需求的时候，MySQL总是能够立刻终止查询。一个典型的例子就是当使用了LIMIT子句的时候。
> ^18-23601-23656

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在很多数据库服务器中，IN()完全等同于多个OR条件的子句，因为这两者是完全等价的。在MySQL中这点是不成立的，MySQL将IN()列表中的数据先进行排序，然后通过二分查找的方式来确定列表中的值是否满足条件，这是一个O(logn)复杂度的操作，等价地转换成OR查询的复杂度为O(n)，对于IN()列表中有大量取值的时候，MySQL的处理速度将会更快。
> ^18-25330-25618
## 第11章 扩展MySQL

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 在20%使用率的CPU下，1000QPS并不意味着还可以增加4000QPS，因为并非每个查询都是相等的。
> ^21-3464-3518
# 读书笔记

### 第7章 创建高性能的索引

> [!Annotation]+ <span style="color: ;">Annotation</span>
> 📌 使用UNION改写查询，往往是最好的办法。 
> ^439222474-7O5Qdd6db
> ---
> 💭 And条件使用联合索引，or条件建议使用union
