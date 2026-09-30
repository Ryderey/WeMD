import { describe, expect, it } from "vitest";
import { createMarkdownParser, processHtml } from "@wemd/core";
import sampleMarkdown from "../fixtures/theme-sample.md?raw";

/**
 * 保真样例的 DOM 覆盖检查。
 *
 * 目的：证明 research/sample.md（镜像为 fixture）确实驱动了设计器需要表达的每一种节点，
 * 避免「CSS 里含某字符串」被当成视觉覆盖。缺任一节点即失败，不得记为样式通过。
 *
 * 两阶段分别统计：
 *   parse = createMarkdownParser 的原始输出
 *   full  = 经 processHtml 结构处理后的输出（section 包裹、figure 归一等在此阶段发生）
 */
const parsed = createMarkdownParser().render(sampleMarkdown);
const full = processHtml(parsed, "#wemd { color: #000; }", false, false);

const wrap = (html: string) => {
  const host = document.createElement("div");
  host.innerHTML = `<section id="wemd">${html}</section>`;
  return host.querySelector<HTMLElement>("#wemd") as HTMLElement;
};

const parseRoot = wrap(parsed);
const fullRoot = wrap(full);

const inParse = (selector: string) =>
  parseRoot.querySelectorAll(selector).length;
const inFull = (selector: string) => fullRoot.querySelectorAll(selector).length;
const present = (selector: string) =>
  inFull(selector) > 0 || inParse(selector) > 0;
const countOf = (selector: string) =>
  Math.max(inFull(selector), inParse(selector));

const REQUIRED: { label: string; selector: string; min?: number }[] = [
  { label: "h1 内容层", selector: "h1 .content" },
  { label: "h2 内容层", selector: "h2 .content" },
  { label: "h3 内容层", selector: "h3 .content" },
  { label: "h4 内容层", selector: "h4 .content" },
  { label: "h5 内容层", selector: "h5 .content" },
  { label: "h6 内容层", selector: "h6 .content" },
  { label: "标题前后缀槽", selector: "h2 .prefix" },
  { label: "章节标签", selector: "h2 .content .chapter-label" },
  { label: "多段引用", selector: "blockquote p", min: 2 },
  { label: "三级引用容器", selector: ".multiquote-3" },
  { label: "三级引用内标题", selector: ".multiquote-3 h3" },
  { label: "引用内加粗", selector: "blockquote strong" },
  { label: "引用内行内代码", selector: "blockquote code" },
  { label: "嵌套无序列表", selector: "ul ul" },
  { label: "嵌套有序列表", selector: "ol ol" },
  { label: "列表内容 section", selector: "li section" },
  { label: "提示块 note", selector: ".callout-note" },
  { label: "提示块 tip", selector: ".callout-tip" },
  { label: "提示块 important", selector: ".callout-important" },
  { label: "提示块 warning", selector: ".callout-warning" },
  { label: "提示块 caution", selector: ".callout-caution" },
  { label: "提示块标题", selector: ".callout-title" },
  { label: "高亮代码块", selector: "pre code.hljs", min: 2 },
  { label: "非高亮代码块", selector: "pre code:not(.hljs)" },
  { label: "行内代码", selector: "p code" },
  { label: "删除线 s", selector: "s" },
  { label: "下划线 u", selector: "u" },
  { label: "斜体", selector: "em" },
  { label: "高亮 mark", selector: "mark" },
  { label: "图片 figure", selector: "figure" },
  { label: "图注 figcaption", selector: "figcaption" },
  { label: "链接图片图注", selector: "figure a + figcaption" },
  { label: "固有尺寸小图", selector: 'figure img[src^="data:"]' },
  { label: "滑动容器一层", selector: ".imageflow-layer1" },
  { label: "滑动容器二层", selector: ".imageflow-layer2" },
  { label: "滑动容器三层", selector: ".imageflow-layer3" },
  { label: "滑动图片", selector: ".imageflow-img" },
  { label: "滑动说明", selector: ".imageflow-caption" },
  { label: "表格容器", selector: ".table-container" },
  { label: "表头单元格", selector: "th" },
  { label: "表体单元格", selector: "td" },
  { label: "脚注条目", selector: ".footnote-item", min: 2 },
  { label: "脚注编号", selector: ".footnote-num", min: 2 },
  { label: "脚注分隔与标题", selector: ".footnotes-sep" },
  { label: "行内公式容器", selector: ".inline-equation" },
  { label: "块级公式容器", selector: ".block-equation" },
  { label: "分割线", selector: "hr" },
  { label: "链接", selector: "a" },
];

describe("fidelity sample DOM coverage", () => {
  it("样例驱动了设计器需要表达的每一种节点", () => {
    const missing = REQUIRED.filter(
      (item) => countOf(item.selector) < (item.min ?? 1),
    ).map(
      (item) =>
        `${item.label} (${item.selector}) 需要 ${item.min ?? 1} 得到 ${countOf(item.selector)}`,
    );

    const report = REQUIRED.map((item) => {
      const sel = item.selector;
      return `${sel} parse=${inParse(sel)} full=${inFull(sel)}`;
    });
    console.log("@@COVERAGE@@\n" + report.join("\n"));
    console.log(
      "@@MATH@@ " +
        JSON.stringify({
          inlineEquation: countOf(".inline-equation"),
          blockEquation: countOf(".block-equation"),
          katex: fullRoot.querySelectorAll(".katex").length,
          svgInEquation:
            parseRoot.querySelectorAll(".block-equation svg").length +
            fullRoot.querySelectorAll(".block-equation svg").length,
        }),
    );

    expect(missing, "样例缺少必需节点：\n" + missing.join("\n")).toEqual([]);
  });

  it("公式渲染技术被如实记录（SVG 需浏览器确认，KaTeX 回退不算 SVG 覆盖）", () => {
    const hasSvg =
      countOf(".block-equation svg") > 0 || countOf(".inline-equation svg") > 0;
    const hasKatex = inFull(".katex") + inParse(".katex") > 0;
    console.log(`@@MATH_MODE@@ svg=${hasSvg} katex=${hasKatex}`);
    expect(present(".block-equation") || present(".inline-equation")).toBe(
      true,
    );
  });
});
