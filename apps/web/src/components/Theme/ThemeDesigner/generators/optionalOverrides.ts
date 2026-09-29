import type { DesignerVariables } from "../types";
import {
  optionalLength,
  optionalUnitless,
  optionalHexColor,
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

  return blocks.length ? `\n${blocks.join("\n\n")}\n` : "";
}

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
