import type { DesignerVariables } from "../types";
import {
  optionalLength,
  optionalUnitless,
  optionalHexColor,
  optionalFontStack,
} from "./safeCssValue";

/**
 * 可选的「追加覆盖」规则。
 *
 * 这些规则整段拼在设计器输出的最后：选择器与既有规则一致，因此靠出现顺序覆盖，
 * 不需要修改原有模板内部，也不会在字段缺省时产生任何新行。
 *
 * 边框一律写成 border-width / border-style / border-color 长属性：微信复制链路会丢
 * 「简写 + var()」的组合。
 */

const BORDER_STYLE = "border-style: solid;";

const borderDeclarations = (width: number, color: string, sides: string) =>
  `border-width: ${sides === "full" ? `${width}px` : `0 0 0 ${width}px`};\n  ${BORDER_STYLE}\n  border-color: ${color};`;

export function generateOptionalOverrides(v: DesignerVariables): string {
  const blocks: string[] = [];

  if (v.linkUnderlineMode === "text") {
    const offset = optionalLength(v.linkUnderlineOffset, 10) ?? 2;
    const underlined = v.linkUnderline !== false;
    blocks.push(`#wemd a {
  text-decoration: ${underlined ? "underline" : "none"};${
    underlined ? `\n  text-underline-offset: ${offset}px;` : ""
  }
  border-bottom: none;
}`);
  }

  if (v.delCoversStrikethrough === true) {
    blocks.push(`#wemd s {
  text-decoration: line-through;
  text-decoration-color: var(--wemd-del-color);
  color: var(--wemd-del-color);
  font-style: normal;
}`);
  }

  if (v.footnoteLayout === "hanging") {
    const numberWidth = optionalLength(v.footnoteNumberWidth, 60, 8) ?? 22;
    const lineHeight = optionalUnitless(v.footnoteLineHeight, 1, 3) ?? 1.8;
    const fontSize = optionalLength(v.footnoteFontSize, 32, 8) ?? 12;
    blocks.push(`#wemd .footnote-num {
  display: inline-block;
  width: ${numberWidth}px;
  font-size: ${fontSize}px;
  font-weight: 400;
  line-height: ${lineHeight};
  opacity: 1;
}
#wemd .footnote-item p {
  display: block;
  padding-left: ${numberWidth}px;
  text-indent: -${numberWidth}px;
  font-size: ${fontSize}px;
  line-height: ${lineHeight};
  word-break: normal;
}`);
  }

  blocks.push(...codeBlockBlocks(v));
  blocks.push(...inlineCodeBlocks(v));
  blocks.push(...tableBlocks(v));
  blocks.push(...imageBlocks(v));
  blocks.push(...imageflowBlocks(v));
  blocks.push(...listBlocks(v));
  blocks.push(...quoteBlocks(v));
  blocks.push(...calloutBlocks(v));
  blocks.push(...equationBlocks(v));

  return blocks.length ? `\n${blocks.join("\n\n")}\n` : "";
}

const quoteSelector = (suffix: string) =>
  `#wemd blockquote${suffix},
#wemd .multiquote-1${suffix},
#wemd .multiquote-2${suffix},
#wemd .multiquote-3${suffix}`;

/**
 * 引用：左右内距可不对称，悬挂缩进与段距、专用字体同时写到容器和引用内的 p —
 * 全局 `#wemd p` 自带 font-family 与 margin，只写容器不会生效。
 */
const quoteBlocks = (v: DesignerVariables): string[] => {
  const left = optionalLength(v.quotePaddingLeft, 80);
  const right = optionalLength(v.quotePaddingRight, 80);
  const indent = optionalLength(v.quoteIndent, 40);
  const gap = optionalLength(v.quoteParagraphGap, 40);
  const family = optionalFontStack(v.quoteFontFamily);

  const outer: string[] = [];
  const indentValue =
    indent === null ? null : indent === 0 ? "0px" : `-${indent}px`;
  if (left !== null || right !== null) {
    outer.push(
      `padding: ${v.quotePaddingY}px ${right ?? v.quotePaddingX}px ${
        v.quotePaddingY
      }px ${left ?? v.quotePaddingX}px;`,
    );
  }
  if (indentValue !== null) outer.push(`text-indent: ${indentValue};`);
  if (family !== null) outer.push(`font-family: ${family};`);

  const inner: string[] = [];
  if (indentValue !== null) inner.push(`text-indent: ${indentValue};`);
  if (family !== null) inner.push(`font-family: ${family};`);
  if (gap !== null) inner.push(`margin: 0 0 ${gap}px !important;`);

  const blocks: string[] = [];
  if (outer.length) {
    blocks.push(`${quoteSelector("")} {\n  ${outer.join("\n  ")}\n}`);
  }
  if (inner.length) {
    blocks.push(`${quoteSelector(" p")} {\n  ${inner.join("\n  ")}\n}`);
  }
  if (gap !== null) {
    blocks.push(
      `${quoteSelector(" p:last-child")} {\n  margin-bottom: 0 !important;\n}`,
    );
  }
  return blocks;
};

const CALLOUT_VARIANTS = `#wemd .callout-note,
#wemd .callout-tip,
#wemd .callout-important,
#wemd .callout-warning,
#wemd .callout-caution`;

// 提示块旧输出里的内距常量，细项只覆盖被设置的那一侧。
const CALLOUT_PADDING_Y = 12;
const CALLOUT_PADDING_X = 16;

/** primary 模式先出，显式细项后出，因此细项始终优先于模式取值。 */
const calloutBlocks = (v: DesignerVariables): string[] => {
  const blocks: string[] = [];

  if (v.calloutStyle === "primary") {
    blocks.push(`#wemd .callout {
  background-color: var(--wemd-primary-color-20);
}
#wemd .callout-title {
  color: var(--wemd-primary-color);
}
${CALLOUT_VARIANTS} {
  border-left-width: 4px;
  border-left-style: solid;
  border-left-color: var(--wemd-primary-color);
}`);
  }

  const background = optionalHexColor(v.calloutBackground);
  const paddingX = optionalLength(v.calloutPaddingX, 40);
  const paddingY = optionalLength(v.calloutPaddingY, 40);
  const box: string[] = [];
  if (paddingX !== null || paddingY !== null) {
    box.push(
      `padding: ${paddingY ?? CALLOUT_PADDING_Y}px ${
        paddingX ?? CALLOUT_PADDING_X
      }px;`,
    );
  }
  if (background !== null) box.push(`background-color: ${background};`);
  if (box.length) {
    blocks.push(`#wemd .callout {\n  ${box.join("\n  ")}\n}`);
  }

  const title: string[] = [];
  const titleFontSize = optionalLength(v.calloutTitleFontSize, 32, 8);
  const titleColor = optionalHexColor(v.calloutTitleColor);
  if (titleFontSize !== null) title.push(`font-size: ${titleFontSize}px;`);
  if (titleColor !== null) title.push(`color: ${titleColor};`);
  if (title.length) {
    blocks.push(`#wemd .callout-title {\n  ${title.join("\n  ")}\n}`);
  }

  const body: string[] = [];
  const bodyFontSize = optionalLength(v.calloutBodyFontSize, 32, 8);
  const bodyColor = optionalHexColor(v.calloutBodyColor);
  if (bodyFontSize !== null) body.push(`font-size: ${bodyFontSize}px;`);
  if (bodyColor !== null) body.push(`color: ${bodyColor};`);
  if (body.length) {
    blocks.push(`#wemd .callout p {\n  ${body.join("\n  ")}\n}`);
  }

  return blocks;
};

/** 滑动图片专用元素同时也是 img 与 p，需要清掉普通图片与段落规则带上来的外距与缩进。 */
const imageflowBlocks = (v: DesignerVariables): string[] => {
  if (v.imageflowLayout !== "reading") return [];
  return [
    `#wemd .imageflow-layer1 {
  margin: var(--wemd-paragraph-margin) 0 8px;
}
#wemd .imageflow-img {
  margin: 0;
  box-shadow: none;
  border-radius: 2px;
}
#wemd .imageflow-caption {
  margin: 6px 0 0;
  text-indent: 0;
}`,
  ];
};

/** 公式在设计师输出里本来没有任何规则，长公式会撑破正文宽度。 */
const equationBlocks = (v: DesignerVariables): string[] => {
  if (v.equationMaxWidth !== true) return [];
  return [
    `#wemd .block-equation svg {
  max-width: 100% !important;
}
#wemd .inline-equation svg {
  max-width: 100%;
  vertical-align: middle;
}`,
  ];
};

/** 横线表格：只有横向分隔线，固定布局与等宽数字。 */
const tableBlocks = (v: DesignerVariables): string[] => {
  if (v.tableStyle !== "rules") return [];
  return [
    `#wemd .table-container {
  margin: 24px 0 28px;
  border-top-width: 1px;
  border-top-style: solid;
  border-top-color: var(--wemd-table-border-color);
}
#wemd table {
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-variant-numeric: tabular-nums;
}
#wemd th,
#wemd td {
  border-width: 0;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  border-bottom-color: var(--wemd-table-border-color);
  padding: 10px 8px;
  font-size: 13.5px;
  font-weight: 400;
  line-height: 1.7;
  text-align: left;
  vertical-align: middle;
  overflow-wrap: anywhere;
}
#wemd th {
  font-weight: 600;
  line-height: 1.65;
}
#wemd td {
  background-color: transparent;
}`,
  ];
};

/** 满宽图片：小图也撑满正文宽度，图注按行高与底距排布。 */
const imageBlocks = (v: DesignerVariables): string[] => {
  if (v.imageLayout !== "fill") return [];
  return [
    `#wemd img {
  width: 100%;
  margin: var(--wemd-image-margin) 0;
}
#wemd figure {
  margin: 0;
}
#wemd figcaption {
  line-height: 1.65;
  margin: 8px 0 var(--wemd-image-margin);
}`,
  ];
};

/** 阅读式列表：缩进、容器距与条目距分离，正文落在 li section 上。 */
const listBlocks = (v: DesignerVariables): string[] => {
  if (v.listLayout !== "reading") return [];
  return [
    `#wemd ul,
#wemd ol {
  padding-left: 1.25em;
  margin: var(--wemd-paragraph-margin) 0;
}
#wemd ul ul,
#wemd ol ol {
  margin: 6px 0 0;
}
#wemd li {
  margin: 0 0 6px;
}
#wemd li section {
  font-size: var(--wemd-font-size);
  font-weight: 400;
  line-height: var(--wemd-line-height);
  color: var(--wemd-text-color);
  margin: 0;
}`,
  ];
};

/** 代码块：外框（pre / pre.custom）与内层（code）分工不同，分别覆盖。 */
const codeBlockBlocks = (v: DesignerVariables): string[] => {
  const border =
    v.codeBlockBorder === "full" || v.codeBlockBorder === "left"
      ? v.codeBlockBorder
      : v.codeBlockBorder === "none"
        ? "none"
        : null;
  const radius = optionalLength(v.codeBlockRadius, 24);
  const paddingX = optionalLength(v.codeBlockPaddingX, 40);
  const paddingY = optionalLength(v.codeBlockPaddingY, 40);
  const lineHeight = optionalUnitless(v.codeBlockLineHeight, 1, 3);
  const containWidth = v.codeBlockContainWidth === true;

  const outer: string[] = [];
  if (border === "none") {
    outer.push("border-width: 0;");
  } else if (border) {
    const width = optionalLength(v.codeBlockBorderWidth, 8, 1) ?? 1;
    const color = optionalHexColor(v.codeBlockBorderColor) ?? "#DDE7DF";
    outer.push(borderDeclarations(width, color, border));
  }
  if (radius !== null) outer.push(`border-radius: ${radius}px;`);
  if (containWidth) outer.push("overflow-x: hidden;");

  const inner: string[] = [];
  if (paddingX !== null || paddingY !== null) {
    inner.push(`padding: ${paddingY ?? 0}px ${paddingX ?? 0}px;`);
  }
  if (lineHeight !== null) inner.push(`line-height: ${lineHeight};`);
  if (containWidth) inner.push("min-width: 0;");

  const blocks: string[] = [];
  if (outer.length) {
    blocks.push(`#wemd pre,
#wemd pre.custom {
  ${outer.join("\n  ")}
}`);
  }
  if (inner.length) {
    blocks.push(`#wemd pre code,
#wemd pre code.hljs,
#wemd pre code:not(.hljs) {
  ${inner.join("\n  ")}
}`);
  }
  return blocks;
};

/** 行内代码与代码块是不同选择器，参数互不影响。 */
const inlineCodeBlocks = (v: DesignerVariables): string[] => {
  const fontSize = optionalLength(v.inlineCodeFontSize, 32, 8);
  const paddingX = optionalLength(v.inlineCodePaddingX, 20);
  const paddingY = optionalLength(v.inlineCodePaddingY, 20);
  const borderWidth = optionalLength(v.inlineCodeBorderWidth, 4);
  const color = optionalHexColor(v.codeBlockBorderColor);

  const decls: string[] = [];
  if (fontSize !== null) decls.push(`font-size: ${fontSize}px;`);
  if (paddingX !== null || paddingY !== null) {
    decls.push(`padding: ${paddingY ?? 0}px ${paddingX ?? 0}px;`);
  }
  if (borderWidth !== null && borderWidth > 0) {
    decls.push(`border-width: ${borderWidth}px;`);
    decls.push(BORDER_STYLE);
    decls.push(`border-color: ${color ?? "var(--wemd-primary-color-50)"};`);
  } else if (borderWidth === 0) {
    decls.push("border-width: 0;");
  }
  if (!decls.length) return [];

  return [
    `#wemd code {
  ${decls.join("\n  ")}
}`,
  ];
};
