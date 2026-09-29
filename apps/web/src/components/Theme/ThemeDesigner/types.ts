// 可视化主题设计器 - 共享类型定义
// 此文件统一定义类型，供 ThemeDesigner 和 builtInThemes 共同使用

/**
 * 标题样式配置
 */
export interface HeadingStyle {
  fontSize: number;
  color: string;
  marginTop: number;
  marginBottom: number;
  preset?: string;
  centered?: boolean;
  fontWeight?: string;
  letterSpacing?: number;
  /** 标题行高（无单位倍数）；未设置时沿用正文行高 */
  lineHeight?: number;
  /** 标题独立字体栈；未设置时沿用全局字体 */
  fontFamily?: string;
  /** 标题下方细线：宽度(px)、颜色、与文字的距离(px)。未设置时不输出任何装饰 */
  ruleBelowWidth?: number;
  ruleBelowColor?: string;
  ruleBelowGap?: number;
}

/**
 * 可视化设计器变量
 */
export interface DesignerVariables {
  // 全局
  fontFamily: string;
  fontSize: string;
  primaryColor: string;
  primaryGradient?: string;
  pageBackgroundColor?: string;
  lineHeight: string;
  pagePadding: number;
  /** 页面上下内边距；未设置时沿用「只设左右」的旧输出 */
  pagePaddingY?: number;
  /** 正文最大宽度并居中；未设置时不输出任何宽度声明 */
  pageMaxWidth?: number;
  baseLetterSpacing: number;

  // 标题
  h1: HeadingStyle;
  h2: HeadingStyle;
  h3: HeadingStyle;
  h4: HeadingStyle;
  /** 五级、六级标题：首批不开放控件，但种子与序列化需要保留 */
  h5?: HeadingStyle;
  h6?: HeadingStyle;

  // 段落
  paragraphMargin: number;
  /** 段前距覆盖值；未设置时取 paragraphMargin */
  paragraphMarginTop?: number;
  /** 段后距覆盖值；未设置时取 paragraphMargin */
  paragraphMarginBottom?: number;
  paragraphPadding: number;
  paragraphColor: string;
  textIndent: boolean;
  textJustify: boolean;

  // 引用
  quoteBackground: string;
  quoteBorderColor: string;
  quoteTextColor: string;
  quotePreset: string;
  quoteBorderStyle: "solid" | "dashed" | "dotted" | "double";
  quoteBorderWidth: number;
  quotePaddingX: number;
  quotePaddingY: number;
  quoteFontSize: number;
  quoteLineHeight: number;
  quoteTextCentered: boolean;

  // 代码
  codeBackground: string;
  codeFontSize: number;
  inlineCodeColor: string;
  inlineCodeBackground: string;
  inlineCodeStyle: string;
  showMacBar: boolean;
  codeTheme: string;

  // 图片
  imageMargin: number;
  imageBorderRadius: number;
  imageShadow: boolean;
  imageCaptionColor: string;
  imageCaptionFontSize: number;
  imageCaptionTextAlign: string;

  // 链接/文本
  linkColor: string;
  linkUnderline: boolean;
  italicColor: string;
  delColor: string;
  markBackground: string;
  markColor: string;
  underlineStyle: "solid" | "wavy" | "dotted" | "dashed";
  underlineColor: string;
  strongStyle: string;
  strongColor: string;
  /**
   * 独立加粗配色（纯色）。空 / 缺失 / 无效 = 加粗颜色跟随主题色；
   * 有效纯色 = 同时作为加粗的默认文字色与装饰色，`strongColor` 仍只覆盖文字色。
   */
  strongAccentColor?: string;

  // 表格
  tableHeaderBackground: string;
  tableHeaderColor: string;
  tableBorderColor: string;
  tableZebra: boolean;

  // 分割线
  hrColor: string;
  hrHeight: number;
  hrMargin: number;
  hrStyle: "solid" | "dashed" | "dotted" | "double" | "pill" | "gradient";

  // 列表
  ulStyle: string;
  ulStyleL2: string;
  olStyle: string;
  olStyleL2: string;
  listSpacing: number;
  listMarkerColor: string;
  listMarkerColorL2: string;
  ulFontSize: string;
  olFontSize: string;

  // 脚注
  footnoteColor: string;
  footnoteFontSize: number;
  footnoteHeader: string;
  footnoteHeaderColor: string;
  footnoteHeaderStyle: string;

  // 提示块
  calloutStyle: "default" | "primary";

  // Mermaid
  mermaidTheme: "base" | "forest" | "dark" | "neutral" | "default";
}

/**
 * 标题级别类型
 */
export type HeadingLevel = "h1" | "h2" | "h3" | "h4";

/**
 * Section Props 基础接口
 */
export interface SectionProps {
  variables: DesignerVariables;
  updateVariable: <K extends keyof DesignerVariables>(
    key: K,
    value: DesignerVariables[K],
  ) => void;
}

/**
 * 标题 Section Props
 */
export interface HeadingSectionProps extends SectionProps {
  activeHeading: HeadingLevel;
  setActiveHeading: (level: HeadingLevel) => void;
  updateHeading: (level: HeadingLevel, style: Partial<HeadingStyle>) => void;
}

/**
 * 全局 Section Props（需要主题色变更处理）
 */
export interface GlobalSectionProps extends SectionProps {
  handlePrimaryColorChange: (color: string) => void;
}
