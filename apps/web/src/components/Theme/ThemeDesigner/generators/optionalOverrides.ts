import type { DesignerVariables } from "../types";
import { optionalLength, optionalUnitless } from "./safeCssValue";

/**
 * 可选的「追加覆盖」规则。
 *
 * 这些规则整段拼在设计器输出的最后：选择器与既有规则一致，因此靠出现顺序覆盖，
 * 不需要修改原有模板内部，也不会在字段缺省时产生任何新行。
 */
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

  return blocks.length ? `\n${blocks.join("\n\n")}\n` : "";
}
