<!-- 测试固定件：内容镜像 .trellis/tasks/09-28-designer-template-preset/research/sample.md。
     任务目录会被归档移动，因此测试不直接引用 research 路径；两处如需改动须同步。
-->
<!-- 保真对照统一样例：整份文件交给实际 createMarkdownParser 解析。
对照原模板/零修改副本/保存重开/刷新；固定字体环境与 362px、677px 视口。
截图前等待字体与图片加载完成，检查图片 naturalWidth > 0。
小图使用内嵌 1x1 PNG，无 width/height 属性，用于发现 max-width 与 width 的区别。
DOM 覆盖检查要求见 implement.md Stage 1；缺节点时不能记为样式通过。
-->

# 一级标题 H1

Intro 段落，含 **加粗**、_斜体_、**_加粗斜体_**、~~删除线~~、++下划线++、==高亮==、`行内代码`、[链接](https://example.com)。

---

## <span class="chapter-label">SECTION 01</span>章节标签标题

标题里显式写的 span 配合「章节标签」预设生成上小字、下主标题的两行结构。

## 二级标题 H2

## <span class="reading-heading"><span class="heading-rule">&nbsp;</span><span class="heading-body"><span class="heading-number">01</span><span class="heading-text">建立 **阅读** [层级](https://example.com)</span></span></span>

显式阅读编号结构包含章前线、编号与带行内标记的主标题。

### 三级标题 H3

#### 四级标题 H4

##### 五级标题 H5

###### 六级标题 H6

## 多段引用

> 引用第一段。用于核对左右不对称内距、悬挂缩进与外距。
>
> 引用第二段。用于核对多段之间的间距。
>
> > 二级引用。用于核对嵌套时的缩进与背景叠加。
> >
> > > 三级引用。用于核对实际解析后的嵌套节点，不预设外层 class。
> >
> > 三级引用里的标题：
> >
> > ### 引用内标题
> >
> > **引用内加粗** 与 `引用内代码`。

> > > 连续三级引用，用于覆盖 multiquote-3。
> > >
> > > ### 三级引用内标题

## 嵌套列表

- 一级无序项，含 **加粗** 与 `行内代码`
- 一级无序项二
  - 二级无序项
  - 二级无序项二
    - 三级无序项

1. 一级有序项
2. 一级有序项二
   1. 二级有序项
   2. 二级有序项二

## 带语言代码块

```js
// JavaScript 示例：核对底色、边框、圆角、行高与逐行行高
function hello() {
  const a = 1;
  const b = 2;
  return a + b;
}
const longLine =
  "abcdefghijklmnopqrstuvwxyz_0123456789_abcdefghijklmnopqrstuvwxyz_0123456789_abcdefghijklmnopqrstuvwxyz_0123456789_abcdefghijklmnopqrstuvwxyz_0123456789";
```

## 无语言代码块

<!-- 当前解析器将空语言按 bash 处理，仍输出 code.hljs；它不覆盖非 hljs 分支。 -->

```
plain code block
第二行，用于核对行高与换行行为
```

## 显式非高亮代码块

<pre><code>plain code without hljs
second line: abcdefghijklmnopqrstuvwxyz_0123456789_abcdefghijklmnopqrstuvwxyz_0123456789_abcdefghijklmnopqrstuvwxyz_0123456789_abcdefghijklmnopqrstuvwxyz_0123456789</code></pre>

## 表格

| 姓名 | 年龄 | 职业     |
| ---- | ---- | -------- |
| 张三 | 18   | 工程师   |
| 李四 | 20   | 设计师   |
| 王五 | 22   | 产品经理 |
| 赵六 | 24   | 测试     |

## 提示块五变体

> [!NOTE]
> 备注提示块正文，用于核对左线颜色、底色、标题与正文字号。

> [!TIP]
> 技巧提示块正文。

> [!IMPORTANT]
> 重要提示块正文。

> [!WARNING]
> 警告提示块正文。

> [!CAUTION]
> 危险提示块正文。

## 图片

![普通图片说明](https://img.wemd.app/example.jpg)

<figure><img alt="固有尺寸 1x1 的小图，检查是否撑满正文宽度" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=" /><figcaption>小尺寸图片：核对全宽与非对称上下间距。</figcaption></figure>

[![链接图片说明](https://img.wemd.app/example.jpg)](https://wemd.app/)

<![滑动图片一](https://img.wemd.app/example.jpg), ![滑动图片二](https://img.wemd.app/example.jpg)>

## 公式

行内公式：$E = mc^2$

行间公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## 脚注

这里演示[第一份资料](https://example.com/reference-one "第一条参考资料说明，用于核对编号宽度与悬挂缩进")，以及[第二份资料](https://example.com/reference-two "第二条参考资料说明：这是一段足够长的文字，用来确保在窄屏和宽屏下都能够观察脚注正文换行后的悬挂缩进、行高与段间距，而不是只比较单行文字的颜色和字号")。

## 分割线

---

## 收尾段落

最后一段正文。
