export const jadeNotesTheme = `/* 青岚风格 —— 松青书页，适合随笔、人文与知识长文 */
#wemd {
  padding: 5px 22px;
  max-width: 677px;
  margin: 0 auto;
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 16px;
  line-height: 1.92;
  letter-spacing: 0;
  color: #3D4841;
  background-color: transparent;
  /* 透明背景，兼容微信深色模式 */
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: left;
}

/* 段落 */
#wemd p {
  margin: 0 0 25px;
  font-size: 16px;
  line-height: 1.92;
  letter-spacing: 0;
  color: #3D4841;
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
  color: #3D4841;
  padding-bottom: 8px;
  border-bottom: 1px solid #DDE7DF;
  letter-spacing: 0;
}

/* 二级标题 */
#wemd h2 {
  margin: 0 0 20px;
  text-align: left;
}

#wemd h2 .content {
  display: inline-block;
  font-size: 20px;
  line-height: 1.6;
  font-weight: 600;
  color: #27675C;
  letter-spacing: 0;
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
  color: #27675C;
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
  color: #27675C;
}

/* 五级、六级标题 */
#wemd h5 .content,
#wemd h6 .content {
  font-size: 14px;
  font-weight: 700;
  color: #3D4841;
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
  margin: 18px 0 25px;
}

#wemd ul ul {
  list-style-type: circle;
  margin: 6px 0 0;
}

/* 有序列表 */
#wemd ol {
  list-style-type: decimal;
  padding-left: 1.25em;
  margin: 18px 0 25px;
}

#wemd ol ol {
  list-style-type: lower-alpha;
  margin: 6px 0 0;
}

#wemd ul li,
#wemd ol li {
  margin: 0 0 6px;
  line-height: 1.92;
}

#wemd li section {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.92;
  color: #3D4841;
}

/* 引用：浅青底、悬挂缩进，不用左侧竖线 */
#wemd blockquote,
#wemd .multiquote-1,
#wemd .multiquote-2,
#wemd .multiquote-3 {
  display: block;
  margin: 26px 0;
  padding: 14px 16px 14px 32px;
  border: 0;
  background-color: #F4F8F5;
  box-shadow: none;
  font-size: 16px;
  line-height: 1.9;
  color: #3D4841;
  text-indent: -16px;
  overflow: visible;
}

#wemd blockquote p,
#wemd .multiquote-1 p,
#wemd .multiquote-2 p,
#wemd .multiquote-3 p {
  margin: 0 0 10px;
  font-size: 16px;
  line-height: 1.9;
  color: #3D4841;
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
  color: #3D4841;
  font-weight: 600;
}

/* 链接 */
#wemd a {
  color: #27675C;
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
  color: #3D4841;
  font-weight: 700;
}

/* 斜体 */
#wemd em {
  color: #3D4841;
  font-style: italic;
}

#wemd em strong {
  color: #3D4841;
  font-weight: 700;
}

/* 高亮 */
#wemd mark {
  color: #3D4841;
  background-color: #E4EDE6;
  padding: 0 2px;
}

/* 删除线（markdown 的 ~~x~~ 产出 <s>，<del> 保留给手写 HTML） */
#wemd s,
#wemd del {
  color: #6D786F;
  font-style: normal;
  text-decoration: line-through;
}

/* 分隔线 */
#wemd hr {
  margin: 34px auto 16px;
  border: 0;
  border-top: 1px solid #DDE7DF;
  width: 100%;
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
  color: #6D786F;
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
  color: #6D786F;
  line-height: 1.65;
  text-align: right;
}

/* 行内代码 */
#wemd p code,
#wemd li code {
  font-family: "Menlo", "Consolas", monospace;
  font-size: 13px;
  color: #3B5548;
  background-color: #F3F7F4;
  border: 1px solid #DDE7DF;
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
  color: #3B5548;
  background-color: #F3F7F4;
  border: 1px solid #DDE7DF;
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
  color: #3B5548;
  background-color: #F3F7F4;
  border: 1px solid #DDE7DF;
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
  border-top: 1px solid #B6CCC1;
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
  color: #27675C;
  background-color: #F4F7F4;
  padding: 10px 8px;
  text-align: left;
  vertical-align: middle;
  border: 0;
  border-bottom: 1px solid #DDE7DF;
}

#wemd table tr td {
  font-size: 13.5px;
  line-height: 1.7;
  font-weight: 400;
  color: #3D4841;
  background-color: transparent;
  padding: 10px 8px;
  text-align: left;
  vertical-align: middle;
  border: 0;
  border-bottom: 1px solid #DDE7DF;
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
  color: #27675C;
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
  color: #27675C;
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
  color: #6D786F;
}

#wemd .footnote-item p {
  display: block;
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.8;
  color: #6D786F;
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
  background-color: #F4F8F5;
  box-shadow: none;
}

#wemd .callout-title {
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.8;
  font-weight: 600;
  letter-spacing: 0;
  color: #27675C;
  margin-bottom: 6px;
}

#wemd .callout p {
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.8;
  color: #6D786F;
  margin: 0;
}

#wemd .callout-note {
  border-left: 4px solid #27675C;
}

#wemd .callout-tip {
  border-left: 4px solid #6D786F;
}

#wemd .callout-important {
  border-left: 4px solid #3D4841;
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
  color: #6D786F;
}
`;
