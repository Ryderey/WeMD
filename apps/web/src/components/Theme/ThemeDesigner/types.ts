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
  /** 引用横线落在哪两侧；top-bottom = 只有上下细线（预设自带的左线会被压回 0） */
  quoteBorderEdges?: "left" | "top-bottom";
  /** 左侧内距覆盖值；未设置时取 quotePaddingX */
  quotePaddingLeft?: number;
  /** 右侧内距覆盖值；未设置时取 quotePaddingX */
  quotePaddingRight?: number;
  /** 悬挂缩进(px)，同时作用到引用容器与引用内的段落 */
  quoteIndent?: number;
  /** 多段引用的段间距(px)；末段不带段后距 */
  quoteParagraphGap?: number;
  /** 引用专用字体；全局 p 自带字体，因此必须同时写到引用内的 p */
  quoteFontFamily?: string;

  // 代码
  codeBackground: string;
  codeFontSize: number;
  inlineCodeColor: string;
  inlineCodeBackground: string;
  inlineCodeStyle: string;
  showMacBar: boolean;
  codeTheme: string;

  // 代码块细项（缺省时不输出任何覆盖规则）
  /** 代码块外框形态；缺省沿用基础主题的边框设置 */
  codeBlockBorder?: "none" | "full" | "left";
  codeBlockBorderColor?: string;
  codeBlockBorderWidth?: number;
  codeBlockRadius?: number;
  codeBlockPaddingX?: number;
  codeBlockPaddingY?: number;
  codeBlockLineHeight?: number;
  /** 让长行在框内横向滚动，而不是把代码块撑破正文宽度 */
  codeBlockContainWidth?: boolean;

  // 行内代码细项
  inlineCodeFontSize?: number;
  inlineCodeBorderWidth?: number;
  inlineCodePaddingX?: number;
  inlineCodePaddingY?: number;

  // 图片
  imageMargin: number;
  imageBorderRadius: number;
  imageShadow: boolean;
  /** 图片布局：fill = 小图也撑满正文宽度 */
  imageLayout?: "contain" | "fill";
  /** 滑动图片布局：reading = 清除普通图片与段落规则对专用元素的影响 */
  imageflowLayout?: "default" | "reading";
  imageCaptionColor: string;
  imageCaptionFontSize: number;
  imageCaptionTextAlign: string;

  // 链接/文本
  linkColor: string;
  linkUnderline: boolean;
  /** 链接下划线形态；缺省沿用 border-bottom 旧输出 */
  linkUnderlineMode?: "border" | "text";
  /** text 模式下划线偏移(px) */
  linkUnderlineOffset?: number;
  italicColor: string;
  delColor: string;
  /** 让删除线样式同时覆盖 Markdown ~~文本~~ 产出的 <s> */
  delCoversStrikethrough?: boolean;
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
  /** 表格形态：rules = 只画横向分隔线、固定布局与等宽数字 */
  tableStyle?: "grid" | "rules";

  // 分割线
  hrColor: string;
  hrHeight: number;
  hrMargin: number;
  hrStyle: "solid" | "dashed" | "dotted" | "double" | "pill" | "gradient";
  /** 分隔线宽度(px)；未设置时不输出宽度声明 */
  hrWidth?: number;
  /** 短分隔线的水平对齐；仅在设了宽度时有视觉差异 */
  hrAlign?: "left" | "center";
  /** 分隔线上边距覆盖值；未设置时取 hrMargin */
  hrMarginTop?: number;
  /** 分隔线下边距覆盖值；未设置时取 hrMargin */
  hrMarginBottom?: number;

  // 列表
  ulStyle: string;
  ulStyleL2: string;
  olStyle: string;
  olStyleL2: string;
  listSpacing: number;
  /** 列表布局：reading = 缩进/容器距/条目距分离，正文落在 li section */
  listLayout?: "default" | "reading";
  listMarkerColor: string;
  listMarkerColorL2: string;
  ulFontSize: string;
  olFontSize: string;

  // 脚注
  footnoteColor: string;
  footnoteFontSize: number;
  /** 脚注布局：hanging = 编号固定宽度 + 正文悬挂缩进 */
  footnoteLayout?: "hanging";
  footnoteNumberWidth?: number;
  footnoteLineHeight?: number;
  footnoteHeader: string;
  footnoteHeaderColor: string;
  footnoteHeaderStyle: string;

  // 提示块
  /**
   * default = 五变体各自的固定配色（旧输出）；
   * primary = 统一底色、左线与标题跟随主题色。
   * 下面的显式细项总是排在模式之后，优先于模式取值。
   */
  calloutStyle: "default" | "primary";
  calloutBackground?: string;
  calloutPaddingX?: number;
  calloutPaddingY?: number;
  calloutTitleFontSize?: number;
  calloutTitleColor?: string;
  calloutBodyFontSize?: number;
  calloutBodyColor?: string;

  // Mermaid
  mermaidTheme: "base" | "forest" | "dark" | "neutral" | "default";

  // 公式
  /** 给公式 svg 补 max-width，防止长公式撑破正文宽度 */
  equationMaxWidth?: boolean;
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
