import type { DesignerVariables, HeadingStyle } from "../types";
import {
  optionalLength,
  optionalUnitless,
  optionalHexColor,
  optionalFontStack,
} from "./safeCssValue";

const FONT_WEIGHT = /^(bold|bolder|lighter|normal|[1-9]00)$/;

/** 标题级可选装饰：独立字体、行高、下方细线。未设置时不输出任何声明。 */
const headingDecorations = (h: HeadingStyle): string => {
  const parts: string[] = [];
  const fontFamily = optionalFontStack(h.fontFamily);
  const lineHeight = optionalUnitless(h.lineHeight, 0.8, 4);
  const ruleWidth = optionalLength(h.ruleBelowWidth, 8, 1);
  const ruleColor = optionalHexColor(h.ruleBelowColor);

  if (fontFamily) parts.push(`font-family: ${fontFamily};`);
  if (lineHeight !== null) parts.push(`line-height: ${lineHeight};`);
  if (ruleWidth !== null && ruleColor) {
    // 细线要贴着文字宽度而不是整行通栏
    parts.push("display: inline-block;");
    parts.push(`border-bottom: ${ruleWidth}px solid ${ruleColor};`);
    parts.push(`padding-bottom: ${optionalLength(h.ruleBelowGap, 40) ?? 0}px;`);
  }
  return parts.length ? `\n  ${parts.join("\n  ")}` : "";
};

/** 五级、六级标题：首批不开放控件，但种子需要能生成与序列化。 */
const minorHeading = (
  h: HeadingStyle | undefined,
  tag: "h5" | "h6",
): string => {
  if (!h) return "";
  const fontSize = optionalLength(h.fontSize, 96, 8);
  if (fontSize === null) return "";

  const color = optionalHexColor(h.color);
  const fontWeight =
    typeof h.fontWeight === "string" && FONT_WEIGHT.test(h.fontWeight)
      ? h.fontWeight
      : "bold";

  return `
#wemd ${tag} .content {
  font-size: ${fontSize}px;
  ${
    color
      ? `color: ${color};
  `
      : ""
  }font-weight: ${fontWeight};
  letter-spacing: ${optionalLength(h.letterSpacing, 10) ?? 0}px;${headingDecorations(h)}
}
#wemd ${tag} { margin: ${optionalLength(h.marginTop, 120) ?? 0}px 0 ${optionalLength(h.marginBottom, 120) ?? 0}px; }
#wemd ${tag} .prefix,
#wemd ${tag} .suffix {
  display: none;
}
`;
};

interface HeadingPreset {
  content: string;
  extra: string;
}

interface TypographyPresets {
  h1Preset: HeadingPreset;
  h2Preset: HeadingPreset;
  h3Preset: HeadingPreset;
  h4Preset: HeadingPreset;
}

export function generateTypography(
  v: DesignerVariables,
  safeFontFamily: string,
  presets: TypographyPresets,
): string {
  const { h1Preset, h2Preset, h3Preset, h4Preset } = presets;

  const marginTop = optionalLength(v.paragraphMarginTop, 64);
  const marginBottom = optionalLength(v.paragraphMarginBottom, 64);
  const paragraphMargin =
    marginTop === null && marginBottom === null
      ? "margin: var(--wemd-paragraph-margin) 0;"
      : `margin: ${marginTop !== null ? `${marginTop}px` : "var(--wemd-paragraph-margin)"} 0 ${
          marginBottom !== null
            ? `${marginBottom}px`
            : "var(--wemd-paragraph-margin)"
        };`;

  return `#wemd p {
  font-family: ${safeFontFamily};
  font-size: var(--wemd-font-size);
  line-height: var(--wemd-line-height);
  ${paragraphMargin}
  padding: var(--wemd-paragraph-padding) 0;
  letter-spacing: var(--wemd-letter-spacing);
  ${v.textIndent ? "text-indent: 2em;" : ""}
  ${v.textJustify ? "text-align: justify;" : ""}
}

#wemd li {
  font-family: ${safeFontFamily};
  margin: var(--wemd-list-spacing) 0;
  line-height: var(--wemd-line-height);
  letter-spacing: var(--wemd-letter-spacing);
}

#wemd h1 .content {
  font-size: var(--wemd-h1-font-size);
  color: var(--wemd-h1-color);
  font-weight: ${v.h1.fontWeight || "bold"};
  letter-spacing: ${v.h1.letterSpacing || 0}px;${headingDecorations(v.h1)}
  ${h1Preset.content}
}
#wemd h1 { margin: var(--wemd-h1-margin-top) 0 var(--wemd-h1-margin-bottom); ${v.h1.centered ? "text-align: center;" : ""} }

#wemd h2 .content {
  font-size: var(--wemd-h2-font-size);
  color: var(--wemd-h2-color);
  font-weight: ${v.h2.fontWeight || "bold"};
  letter-spacing: ${v.h2.letterSpacing || 0}px;${headingDecorations(v.h2)}
  ${h2Preset.content}
}
#wemd h2 { margin: var(--wemd-h2-margin-top) 0 var(--wemd-h2-margin-bottom); ${v.h2.centered ? "text-align: center;" : ""} }

#wemd h3 .content {
  font-size: var(--wemd-h3-font-size);
  color: var(--wemd-h3-color);
  font-weight: ${v.h3.fontWeight || "bold"};
  letter-spacing: ${v.h3.letterSpacing || 0}px;${headingDecorations(v.h3)}
  ${h3Preset.content}
}
#wemd h3 { margin: var(--wemd-h3-margin-top) 0 var(--wemd-h3-margin-bottom); ${v.h3.centered ? "text-align: center;" : ""} }

#wemd h4 .content {
  font-size: var(--wemd-h4-font-size);
  color: var(--wemd-h4-color);
  font-weight: ${v.h4.fontWeight || "bold"};
  letter-spacing: ${v.h4.letterSpacing || 0}px;${headingDecorations(v.h4)}
  ${h4Preset.content}
}
#wemd h4 { margin: var(--wemd-h4-margin-top) 0 var(--wemd-h4-margin-bottom); ${v.h4.centered ? "text-align: center;" : ""} }

#wemd ul { list-style-type: ${v.ulStyle}; padding-left: 20px; margin: var(--wemd-paragraph-margin) 0; font-size: ${!v.ulFontSize || v.ulFontSize === "inherit" ? "var(--wemd-font-size)" : v.ulFontSize}; }
#wemd ul ul { list-style-type: ${v.ulStyleL2}; margin: 4px 0; }
#wemd ol { list-style-type: ${v.olStyle}; padding-left: 20px; margin: var(--wemd-paragraph-margin) 0; font-size: ${!v.olFontSize || v.olFontSize === "inherit" ? "var(--wemd-font-size)" : v.olFontSize}; }
#wemd ol ol { list-style-type: ${v.olStyleL2}; margin: 4px 0; }
/* 列表符号颜色 */
#wemd ul li::marker,
  #wemd ol li::marker {
  color: var(--wemd-list-marker-color);
}
#wemd ul ul li::marker,
  #wemd ol ol li::marker,
    #wemd ul ol li::marker,
      #wemd ol ul li::marker {
  color: var(--wemd-list-marker-color-l2);
}${minorHeading(v.h5, "h5")}${minorHeading(v.h6, "h6")}`;
}
