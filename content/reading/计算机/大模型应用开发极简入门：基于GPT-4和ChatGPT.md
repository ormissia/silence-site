---
doc_type: weread-highlights-reviews
bookId: "3300090305"
title: 大模型应用开发极简入门：基于GPT-4和ChatGPT
reviewCount: 0
noteCount: 19
author: 奥利维耶·卡埃朗  【法】玛丽-艾丽斯·布莱特
cover: https://cdn.weread.qq.com/weread/cover/44/cpplatform_uzfvcz8q85gdzbaqvchudt/t6_cpplatform_uzfvcz8q85gdzbaqvchudt1709868767.jpg
readingStatus: "4"
progress: 99%
readingTime: 3小时46分钟
readingDate: 2024-03-10
finishedDate: 2024-03-19
isbn: 9787115636409
category: 计算机 编程设计
rating: 70.6%
readProgress: 99
readingTimestamp: 13566
lastReadDate: 2024-03-19
lastReadTimestamp: 1710854253
tags:
  - 读书笔记
  - 计算机
  - 编程设计
  - 读完
totalWords:

---

# 大模型应用开发极简入门：基于GPT-4和ChatGPT

# 元数据
> [!abstract] 大模型应用开发极简入门：基于GPT-4和ChatGPT
> - ![ 大模型应用开发极简入门：基于GPT-4和ChatGPT|200](https://cdn.weread.qq.com/weread/cover/44/cpplatform_uzfvcz8q85gdzbaqvchudt/t6_cpplatform_uzfvcz8q85gdzbaqvchudt1709868767.jpg)
> - 书名： 大模型应用开发极简入门：基于GPT-4和ChatGPT
> - 作者： 奥利维耶·卡埃朗  【法】玛丽-艾丽斯·布莱特
> - 简介： 本书为大模型应用开发极简入门手册，为初学者提供了一份清晰、全面的“可用知识”，带领大家快速了解GPT-4和ChatGPT的工作原理及优势，并在此基础上使用流行的Python编程语言构建大模型应用。通过本书，你不仅可以学会如何构建文本生成、问答和内容摘要等初阶大模型应用，还能了解到提示工程、模型微调、插件、LangChain等高阶实践技术。书中提供了简单易学的示例，帮你理解并应用在自己的项目中。此外，书后还提供了一份术语表，方便你随时参考。  准备好了吗？只需了解Python，你即可将本书作为进入大模型时代的启动手册，开发出自己的大模型应用。
> - 出版时间 2024-02-01 00:00:00
> - ISBN： 9787115636409
> - 分类： 计算机-编程设计
> - 出版社： 人民邮电出版社有限公司



---

# 高亮划线

### 1.1 LLM概述

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 机器学习(machinelearning，ML)是AI的一个子集。
> ^14-896-937

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 NLP是AI的一个子领域，专注于使计算机能够处理、解释和生成人类语言。现代NLP解决方案基于ML算法。NLP的目标是让计算机能够处理自然语言文本。
> ^14-1805-1878

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 LLM是试图完成文本生成任务的一类ML模型。LLM使计算机能够处理、解释和生成人类语言，从而提高人机交互效率。
> ^14-2628-2683

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 Transformer架构彻底改变了NLP领域，这主要是因为它能够有效地解决之前的NLP模型（如RNN）存在的一个关键问题：很难处理长文本序列并记住其上下文。换句话说，RNN在处理长文本序列时容易忘记上下文（也就是臭名昭著的“灾难性遗忘问题”），Transformer则具备高效处理和编码上下文的能力。
> ^14-3686-3837

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 模型不再将文本序列中的所有词视为同等重要，而是在任务的每个步骤中关注最相关的词。交叉注意力和自注意力是基于注意力机制的两个架构模块，它们经常出现在LLM中。Transformer架构广泛使用了交叉注意力模块和自注意力模块。
> ^14-3922-4085

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 交叉注意力有助于模型确定输入文本的不同部分与输出文本中下一个词的相关性。它就像一盏聚光灯，照亮输入文本中的词或短语，并突出显示预测下一个词所需的相关信息，同时忽略不重要的细节。
> ^14-4114-4202

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 自注意力机制是指模型能够关注其输入文本的不同部分。具体到NLP领域，自注意力机制使模型能够评估句子中的每个词相比于其他词的重要性。这使得模型能够更好地理解各词之间的关系，并根据输入文本中的多个词构建新概念。
> ^14-4933-5036
### 2.6 使用其他文本补全模型

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 文本补全和聊天补全之间有一个重要的区别：两者都能生成文本，但聊天补全更适用于对话。
> ^26-1160-1201
### 3.3 LLM驱动型应用程序的漏洞

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 如果你计划开发和部署一个面向用户的应用程序，那么我们建议你结合以下两种方法。
>
>01.添加分析层来过滤用户输入和模型输出。
>
>02.意识到提示词注入不可避免，并采取一定的预防措施。
>
>￼请务必认真对待提示词注入威胁。
> ^33-1109-1483
### 4.1 提示工程

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 AI工程师必须知道如何与AI进行交互，以获取可用于应用程序的有利结果。此外，AI工程师还必须知道如何正确提问和编写高质量的提示词。
> ^37-1562-1627
### 4.2 微调

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 对于这个例子，你需要收集大量电子邮件，其中包含关于特定业务领域的数据、客户咨询及针对这些咨询的回复。然后，你可以使用这些数据微调现有模型，以使模型学习公司所用的语言模式和词汇。微调后的模型本质上是基于OpenAI提供的原始模型构建的新模型，其中模型的内部权重被调整，以适应特定问题，从而能够在相关任务上提高准确性。通过对现有模型进行微调，你可以创建一个专门针对特定业务所用语言模式和词汇的电子邮件自动回复生成器。
> ^38-717-923

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 微调是指针对特定任务在一组数据上重新训练现有模型，以提高模型的性能并使其回答更准确。在微调过程中，模型的内部参数得到更新。少样本学习则是通过提示词向模型提供有限数量的好例子，以指导模型根据这些例子给出目标结果。在少样本学习过程中，模型的内部参数不会被修改。
> ^38-2663-2817

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 微调非常适合有大量数据可用的场景。这种定制化确保模型生成的内容更符合目标领域的特定语言模式、词汇和语气￼。
> ^38-2944-3199

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 少样本学习是一种更灵活的方法，其数据使用率也更高，因为它不需要重新训练模型。当只有有限的示例可用或需要快速适应不同任务时，这种技巧非常有益。少样本学习让开发人员能够快速设计原型并尝试各种任务，这使其成为许多用例的实用选择。
> ^38-3228-3339

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 这两种方法的另一个关键选择标准是成本，毕竟使用和训练微调模型更贵。
> ^38-3339-3372

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 微调通常需要用到大量数据￼。
> ^38-3401-3560

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 迁移学习是指将从一个领域学到的知识应用于不同但相关的领域。
> ^38-4039-4068

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 微调提供了一种强大的技术手段，有助于提升模型在各类应用场景中的性能。
> ^38-7739-7773

> [!Cite]+ <span style="color: #ffce78;">Highlight</span>
> 📌 一个经过微调的模型可以针对高度专业化的主题生成高质量、引人入胜且与上下文相关的内容。对于这种任务，基础模型可能没有足够的训练数据来保持准确性。与其他所有用例一样，你需要创建一个训练数据集，以使模型专门用于生成专业内容。为此，你需要找到许多关于专业领域的文章。
> ^38-9901-10030

