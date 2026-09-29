/**
 * 阅读版式系列（素笺 / 墨刊 / 青岚 / 蓝图 / 朱砂）
 *
 * 五款共享同一套阅读排版基座，仅调色板与少数分块参数不同，因此用工厂生成，
 * 避免五份近乎重复的 CSS；每款仍导出独立的主题字符串，注册方式与其他内置主题一致。
 *
 * 基座对应的 WeMD 结构约定见 .trellis/tasks/09-28-reading-edition-theme/design.md
 */

interface ReadingPalette {
  accent: string;
  ink: string;
  muted: string;
  surface: string;
  rule: string;
  /** 正文行高 */
  rhythm: string;
  /** 段间距(px) */
  paragraphGap: number;
  /** 高亮底色 */
  markBg: string;
  /** 版本说明，写进 CSS 头注释 */
  tagline: string;
}

interface ReadingDeltas {
  /** 二级标题：默认 sans / 20px / 1.6 / 600 / ink */
  heading2?: {
    family?: string;
    size?: string;
    lineHeight?: string;
    letterSpacing?: string;
    align?: string;
    color?: string;
  };
  /** 引用：默认 sans / 16px / 基座行高 / 白底 / 1px 左竖线 / 8px 0 8px 24px */
  quote?: {
    family?: string;
    size?: string;
    lineHeight?: string;
    background?: string;
    padding?: string;
    borderLeft?: string;
    borderTop?: string;
    borderBottom?: string;
  };
  /** 分隔线：默认 1px rule / 100% / 34px auto 16px */
  divider?: { borderTop?: string; width?: string; margin?: string };
  /** 表格外框上边线 */
  tableTop?: string;
  tableHeader?: { background?: string; color?: string; borderBottom?: string };
  /** 代码块：默认 surface 底 / ink 字 / 1px rule 全框 */
  code?: { background?: string; color?: string; border?: string };
  /** 提示块底色，默认与正文强调底色 surface 相同 */
  calloutBg?: string;
}

const createReadingEdition = (
  name: string,
  palette: ReadingPalette,
  deltas: ReadingDeltas = {},
): string => {
  const {
    accent,
    ink,
    muted,
    surface,
    rule,
    rhythm,
    paragraphGap,
    markBg,
    tagline,
  } = palette;

  const h2 = {
    family: deltas.heading2?.family ?? "",
    size: deltas.heading2?.size ?? "20px",
    lineHeight: deltas.heading2?.lineHeight ?? "1.6",
    letterSpacing: deltas.heading2?.letterSpacing ?? "0",
    align: deltas.heading2?.align ?? "left",
    color: deltas.heading2?.color ?? ink,
  };

  const quote = {
    family: deltas.quote?.family ?? "",
    size: deltas.quote?.size ?? "16px",
    lineHeight: deltas.quote?.lineHeight ?? rhythm,
    background: deltas.quote?.background ?? "#FFFFFF",
    padding: deltas.quote?.padding ?? "8px 0 8px 24px",
    borderLeft: deltas.quote?.borderLeft ?? `1px solid ${rule}`,
    borderTop: deltas.quote?.borderTop ?? "",
    borderBottom: deltas.quote?.borderBottom ?? "",
  };

  const divider = {
    borderTop: deltas.divider?.borderTop ?? `1px solid ${rule}`,
    width: deltas.divider?.width ?? "100%",
    margin: deltas.divider?.margin ?? "34px auto 16px",
  };

  const tableTop = deltas.tableTop ?? `1px solid ${rule}`;
  const tableHeader = {
    background: deltas.tableHeader?.background ?? surface,
    color: deltas.tableHeader?.color ?? accent,
    borderBottom: deltas.tableHeader?.borderBottom ?? `1px solid ${rule}`,
  };

  const code = {
    background: deltas.code?.background ?? surface,
    color: deltas.code?.color ?? ink,
    border: deltas.code?.border ?? `1px solid ${rule}`,
  };

  const calloutBg = deltas.calloutBg ?? surface;

  return `/* ${name}风格 —— ${tagline} */
#wemd {
  padding: 5px 22px;
  max-width: 677px;
  margin: 0 auto;
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 16px;
  line-height: ${rhythm};
  letter-spacing: 0;
  color: ${ink};
  background-color: transparent;
  /* 透明背景，兼容微信深色模式 */
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: left;
}

/* 段落 */
#wemd p {
  margin: 0 0 ${paragraphGap}px;
  font-size: 16px;
  line-height: ${rhythm};
  letter-spacing: 0;
  color: ${ink};
  text-align: left;
  overflow-wrap: break-word;
}

/* 一级标题 */
#wemd h1 {
  margin: 34px 0 22px;
  text-align: left;
}

#wemd h1 .content {
  display: inline-block;
  font-size: 24px;
  line-height: 1.5;
  font-weight: 600;
  color: ${ink};
  padding-bottom: 8px;
  border-bottom: 1px solid ${rule};
  letter-spacing: 0;
}

/* 二级标题 */
#wemd h2 {
  margin: 0 0 20px;
  text-align: ${h2.align};
}

#wemd h2 .content {
  display: inline-block;
  ${h2.family ? `font-family: ${h2.family};\n  ` : ""}font-size: ${h2.size};
  line-height: ${h2.lineHeight};
  font-weight: 600;
  color: ${h2.color};
  letter-spacing: ${h2.letterSpacing};
}

/* 三级标题 */
#wemd h3 {
  margin: 26px 0 12px;
  text-align: left;
}

#wemd h3 .content {
  display: inline-block;
  font-size: 17px;
  line-height: 1.7;
  font-weight: 600;
  color: ${accent};
  letter-spacing: 0;
}

/* 四级标题 */
#wemd h4 {
  margin: 22px 0 10px;
  text-align: left;
}

#wemd h4 .content {
  display: inline-block;
  font-size: 15px;
  line-height: 1.6;
  font-weight: 700;
  color: ${accent};
}

/* 五级、六级标题 */
#wemd h5 .content,
#wemd h6 .content {
  font-size: 14px;
  font-weight: 700;
  color: ${ink};
}

#wemd h1 .prefix,
#wemd h1 .suffix,
#wemd h2 .prefix,
#wemd h2 .suffix,
#wemd h3 .prefix,
#wemd h3 .suffix,
#wemd h4 .prefix,
#wemd h4 .suffix,
#wemd h5 .prefix,
#wemd h5 .suffix,
#wemd h6 .prefix,
#wemd h6 .suffix {
  display: none;
}

/* 无序列表 */
#wemd ul {
  list-style-type: disc;
  padding-left: 1.25em;
  margin: 18px 0 ${paragraphGap}px;
}

#wemd ul ul {
  list-style-type: circle;
  margin: 6px 0 0;
}

/* 有序列表 */
#wemd ol {
  list-style-type: decimal;
  padding-left: 1.25em;
  margin: 18px 0 ${paragraphGap}px;
}

#wemd ol ol {
  list-style-type: lower-alpha;
  margin: 6px 0 0;
}

#wemd ul li,
#wemd ol li {
  margin: 0 0 6px;
  line-height: ${rhythm};
}

#wemd li section {
  font-size: 16px;
  font-weight: 400;
  line-height: ${rhythm};
  color: ${ink};
}

/* 引用：悬挂缩进，不用投影 */
#wemd blockquote,
#wemd .multiquote-1,
#wemd .multiquote-2,
#wemd .multiquote-3 {
  display: block;
  margin: 26px 0;
  padding: ${quote.padding};
  border: 0;${
    quote.borderLeft ? `\n  border-left: ${quote.borderLeft};` : ""
  }${quote.borderTop ? `\n  border-top: ${quote.borderTop};` : ""}${
    quote.borderBottom ? `\n  border-bottom: ${quote.borderBottom};` : ""
  }
  background-color: ${quote.background};
  box-shadow: none;${quote.family ? `\n  font-family: ${quote.family};` : ""}
  font-size: ${quote.size};
  line-height: ${quote.lineHeight};
  color: ${ink};
  text-indent: -16px;
  overflow: visible;
}

#wemd blockquote p,
#wemd .multiquote-1 p,
#wemd .multiquote-2 p,
#wemd .multiquote-3 p {
  margin: 0 0 10px;
  font-size: ${quote.size};
  line-height: ${quote.lineHeight};
  color: ${ink};
  text-align: left;
  text-indent: -16px;
}

#wemd blockquote p:last-child,
#wemd .multiquote-1 p:last-child,
#wemd .multiquote-2 p:last-child,
#wemd .multiquote-3 p:last-child {
  margin-bottom: 0;
}

#wemd .multiquote-3 h3 {
  text-align: left;
}

#wemd blockquote strong,
#wemd .multiquote-1 strong,
#wemd .multiquote-2 strong,
#wemd .multiquote-3 strong {
  color: ${ink};
  font-weight: 600;
}

/* 链接 */
#wemd a {
  color: ${accent};
  font-weight: 400;
  text-decoration: underline;
  text-underline-offset: 2px;
  word-wrap: break-word;
  border: 0;
}

#wemd .table-of-contents a {
  text-decoration: none;
}

/* 加粗 */
#wemd strong {
  color: ${ink};
  font-weight: 700;
}

/* 斜体 */
#wemd em {
  color: ${ink};
  font-style: italic;
}

#wemd em strong {
  color: ${ink};
  font-weight: 700;
}

/* 高亮 */
#wemd mark {
  color: ${ink};
  background-color: ${markBg};
  padding: 0 2px;
}

/* 删除线（markdown 的 ~~x~~ 产出 <s>，<del> 保留给手写 HTML） */
#wemd s,
#wemd del {
  color: ${muted};
  font-style: normal;
  text-decoration: line-through;
}

/* 分隔线 */
#wemd hr {
  margin: ${divider.margin};
  border: 0;
  border-top: ${divider.borderTop};
  width: ${divider.width};
  height: 0;
  background: none;
  font-size: 0;
  line-height: 0;
}

/* 图片 */
#wemd img {
  display: block;
  width: 100%;
  height: auto;
  margin: 26px 0 8px;
}

#wemd figure {
  margin: 0;
}

#wemd figcaption {
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 12px;
  line-height: 1.65;
  color: ${muted};
  text-align: right;
  margin: 0 0 26px;
  overflow-wrap: break-word;
}

/* 图片链接嵌套：去掉基础主题的深色浮层与负外边距 */
#wemd figure a + figcaption {
  display: block;
  width: 100%;
  margin: 0 0 26px;
  background: transparent;
  color: ${muted};
  line-height: 1.65;
  text-align: right;
}

/* 行内代码 */
#wemd p code,
#wemd li code {
  font-family: "Menlo", "Consolas", monospace;
  font-size: 13px;
  color: ${code.color};
  background-color: ${code.background};
  border: 1px solid ${rule};
  border-radius: 2px;
  padding: 1px 4px;
  margin: 0 2px;
}

/* 代码块：容器管外边距，代码元素管内框，避免 mac 栏与代码框脱节
   注：white-space 由基础主题固定在 pre（不换行、横向滚动），主题层压不动也不必压 */
#wemd pre {
  margin: 24px 0 26px;
}

#wemd pre code.hljs {
  display: block;
  margin: 0;
  min-width: 0;
  font-family: "Menlo", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.75;
  color: ${code.color};
  background-color: ${code.background};
  border: ${code.border};
  border-radius: 4px;
  padding: 14px 16px;
  word-break: break-word;
  overflow-x: auto;
}

#wemd pre code:not(.hljs) {
  display: block;
  margin: 0;
  min-width: 0;
  font-family: "Menlo", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.75;
  color: ${code.color};
  background-color: ${code.background};
  border: ${code.border};
  border-radius: 4px;
  padding: 14px 16px;
  word-break: break-word;
  overflow-x: auto;
}

/* 语法高亮逐行行高由 span 决定，需与代码块一致 */
#wemd pre code span {
  line-height: 1.75;
}

/* 表格 */
#wemd .table-container {
  margin: 24px 0 28px;
  border-top: ${tableTop};
}

#wemd table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

#wemd table tr th {
  font-size: 13.5px;
  line-height: 1.65;
  font-weight: 600;
  color: ${tableHeader.color};
  background-color: ${tableHeader.background};
  padding: 10px 8px;
  text-align: left;
  vertical-align: middle;
  border: 0;
  border-bottom: ${tableHeader.borderBottom};
}

#wemd table tr td {
  font-size: 13.5px;
  line-height: 1.7;
  font-weight: 400;
  color: ${ink};
  background-color: transparent;
  padding: 10px 8px;
  text-align: left;
  vertical-align: middle;
  border: 0;
  border-bottom: 1px solid ${rule};
  overflow-wrap: anywhere;
}

/* 源模板不区分隔行，抵消基础主题的斑马底 */
#wemd table tr:nth-child(2n),
#wemd table tr:nth-child(2n) td {
  background-color: transparent;
}

/* 脚注与参考资料 */
#wemd .footnote-word,
#wemd .footnote-ref {
  color: ${accent};
  font-weight: 400;
}

#wemd .footnotes-sep {
  border-top: 0;
  padding: 2px 0 4px;
  margin: 34px 0 22px;
}

#wemd .footnotes-sep:before {
  font-size: 13px;
  line-height: 1.6;
  font-weight: 600;
  color: ${accent};
  margin-bottom: 14px;
}

#wemd .footnote-num {
  display: inline-block;
  width: 22px;
  background: none;
  opacity: 1;
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 12px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  line-height: 1.6;
  color: ${muted};
}

#wemd .footnote-item p {
  display: block;
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.8;
  color: ${muted};
  padding-left: 22px;
  text-indent: -22px;
  margin: 0 0 8px;
  word-break: normal;
  overflow-wrap: anywhere;
}

/* 说明块（提示块） */
#wemd .callout {
  margin: 24px 0 26px;
  padding: 14px 16px;
  border: 0;
  border-radius: 4px;
  background-color: ${calloutBg};
  box-shadow: none;
}

#wemd .callout-title {
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.8;
  font-weight: 600;
  letter-spacing: 0;
  color: ${accent};
  margin-bottom: 6px;
}

#wemd .callout p {
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.8;
  color: ${muted};
  margin: 0;
}

#wemd .callout-note {
  border-left: 4px solid ${accent};
}

#wemd .callout-tip {
  border-left: 4px solid ${muted};
}

#wemd .callout-important {
  border-left: 4px solid ${ink};
}

#wemd .callout-warning {
  border-left: 4px solid #C98A4B;
}

#wemd .callout-caution {
  border-left: 4px solid #B0574B;
}

/* 公式 */
#wemd .block-equation svg {
  max-width: 100% !important;
}

#wemd .inline-equation svg {
  max-width: 100%;
  vertical-align: middle;
}

/* 横向滑动图片（基础与语法高亮主题的规则同特异性，需提高一级） */
#wemd section.imageflow-layer1 {
  margin: 26px 0 8px;
  border: 0 none;
  padding: 0;
  overflow: hidden;
  white-space: normal;
}

#wemd section.imageflow-layer2 {
  white-space: nowrap;
  width: 100%;
  overflow-x: scroll;
}

#wemd section.imageflow-layer3 {
  display: inline-block;
  word-wrap: break-word;
  white-space: normal;
  vertical-align: top;
  width: 80%;
  margin-right: 10px;
  flex-shrink: 0;
}

#wemd img.imageflow-img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 300px;
  margin: 0;
  object-fit: contain;
  border-radius: 2px;
}

#wemd p.imageflow-caption {
  text-align: center;
  margin: 6px 0 0;
  padding-top: 0;
  font-size: 12px;
  color: ${muted};
}
`;
};

export const plainPaperTheme = createReadingEdition(
  "素笺",
  {
    accent: "#756655",
    ink: "#3F3D39",
    muted: "#74706A",
    surface: "#F8F6F1",
    rule: "#E6E0D7",
    rhythm: "1.90",
    paragraphGap: 24,
    tagline: "暖灰留白 · 适合长文与生活随笔",
    markBg: "#EFEAE2",
  },
  {
    heading2: {
      size: "21px",
      lineHeight: "1.55",
      letterSpacing: "0.5px",
      align: "center",
    },
    divider: {
      borderTop: "1px solid #C8BFB2",
      width: "28px",
      margin: "36px auto 14px",
    },
    quote: {
      borderLeft: "",
      borderTop: "1px solid #E6E0D7",
      borderBottom: "1px solid #E6E0D7",
      padding: "12px 16px 12px 32px",
      lineHeight: "1.86",
    },
    tableTop: "1px solid #CFC5B7",
    code: { background: "#FAF9F6" },
  },
);

export const inkJournalTheme = createReadingEdition(
  "墨刊",
  {
    accent: "#272727",
    ink: "#3C3C3A",
    muted: "#73736F",
    surface: "#F6F6F3",
    rule: "#E2E2DD",
    rhythm: "1.84",
    paragraphGap: 24,
    tagline: "黑白刊物 · 适合深度报道与人物文章",
    markBg: "#EAEAE6",
  },
  {
    heading2: {
      family: "Songti SC, Noto Serif CJK SC, SimSun, serif",
      size: "22px",
      lineHeight: "1.55",
      color: "#272727",
    },
    divider: { borderTop: "1px solid #464644" },
    quote: {
      family: "Songti SC, Noto Serif CJK SC, SimSun, serif",
      size: "17px",
      lineHeight: "1.85",
      borderLeft: "1px solid #B6B6B2",
      padding: "6px 0 6px 24px",
    },
    tableTop: "1px solid #60605C",
    tableHeader: {
      background: "#FFFFFF",
      color: "#303030",
      borderBottom: "1px solid #B7B7B2",
    },
    code: {
      background: "#F8F8F6",
      border: "0; border-left: 1px solid #CFCFCB",
    },
  },
);

export const jadeNotesTheme = createReadingEdition(
  "青岚",
  {
    accent: "#27675C",
    ink: "#3D4841",
    muted: "#6D786F",
    surface: "#F4F7F4",
    rule: "#DDE7DF",
    rhythm: "1.92",
    paragraphGap: 25,
    tagline: "松青书页，适合随笔、人文与知识长文",
    markBg: "#E4EDE6",
  },
  {
    heading2: { color: "#27675C" },
    quote: {
      borderLeft: "",
      background: "#F4F8F5",
      padding: "14px 16px 14px 32px",
      lineHeight: "1.9",
    },
    tableTop: "1px solid #B6CCC1",
    code: { background: "#F3F7F4", color: "#3B5548" },
    calloutBg: "#F4F8F5",
  },
);

export const blueprintTheme = createReadingEdition(
  "蓝图",
  {
    accent: "#2857B7",
    ink: "#3B424D",
    muted: "#6D7684",
    surface: "#F1F5FC",
    rule: "#DFE6F1",
    rhythm: "1.84",
    paragraphGap: 22,
    tagline: "理性蓝调 · 适合科技、方法与数据解读",
    markBg: "#E3EAF7",
  },
  {
    heading2: { lineHeight: "1.55", color: "#2F3540" },
    divider: { margin: "32px auto 16px" },
    quote: { borderLeft: "2px solid #ABC0E5", lineHeight: "1.85" },
    tableTop: "1px solid #B4C7E7",
    code: { background: "#F6F8FC" },
  },
);

export const cinnabarTheme = createReadingEdition(
  "朱砂",
  {
    accent: "#A3453C",
    ink: "#443B38",
    muted: "#7A6D69",
    surface: "#FBF6F3",
    rule: "#EBE1DB",
    rhythm: "1.88",
    paragraphGap: 24,
    tagline: "砖红篇章 · 适合观点、文化与品牌故事",
    markBg: "#F2E4DF",
  },
  {
    heading2: { size: "21px", lineHeight: "1.55" },
    divider: {
      borderTop: "1px solid #BB796F",
      width: "28px",
      margin: "36px 0 16px",
    },
    quote: {
      borderLeft: "",
      background: "#FCF8F5",
      padding: "14px 16px 14px 32px",
    },
    code: { background: "#FBF8F5" },
  },
);
