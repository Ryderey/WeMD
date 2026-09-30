import type {
  DesignerVariables,
  HeadingStyle,
} from "../../components/Theme/ThemeDesigner/types";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { getReadingHeadingDefaults } from "../../components/Theme/ThemeDesigner/readingHeadings";

/**
 * 「模板 · 复制后编辑」的五份变量种子。
 *
 * 每份都是完整的 DesignerVariables：可视化主题的 CSS 由 generateCSS 自包含生成，
 * 不叠加 basicTheme，所以这里必须把阅读版式靠 basic 继承的那部分也显式写出来。
 * 取值来源是 packages/core/src/themes/reading-editions.ts（保真基准，本文件不改它）。
 */

/** 阅读版式之间共享的调色板字段 */
interface EditionPalette {
  accent: string;
  ink: string;
  muted: string;
  surface: string;
  rule: string;
  /** 正文行高 */
  rhythm: number;
  /** 段间距(px) */
  paragraphGap: number;
  markBg: string;
}

interface EditionQuote {
  background: string;
  /** 左竖线宽度；0 = 无竖线 */
  borderWidth: number;
  borderColor: string;
  /** true = 只有上下横线（素笺、朱砂一类） */
  edgesTopBottom?: boolean;
  paddingY: number;
  paddingXRight: number;
  paddingXLeft: number;
  fontSize: number;
  lineHeight: number;
  fontFamily?: string;
}

interface EditionDivider {
  color: string;
  /** null = 通栏，不输出宽度 */
  width: number | null;
  align?: "left" | "center";
  marginTop: number;
  marginBottom: number;
}

interface EditionTable {
  /** 缺省用 surface */
  headerBackground?: string;
  headerColor: string;
  borderColor: string;
}

interface EditionCode {
  background: string;
  color: string;
  border: "full" | "left";
  borderColor: string;
}

interface EditionShape {
  h2: Partial<HeadingStyle>;
  quote: EditionQuote;
  divider: EditionDivider;
  table: EditionTable;
  code: EditionCode;
  /** 缺省用 surface */
  calloutBackground?: string;
}

const SERIF = "Songti SC, Noto Serif CJK SC, SimSun, serif";

const buildEdition = (
  palette: EditionPalette,
  shape: EditionShape,
): DesignerVariables => {
  const { accent, ink, muted, surface, rule, rhythm, paragraphGap, markBg } =
    palette;
  const { h2, quote, divider, table, code } = shape;

  const minor = (overrides: Partial<HeadingStyle>): HeadingStyle => ({
    fontSize: 14,
    color: ink,
    fontWeight: "700",
    letterSpacing: 0,
    // 浏览器对照实测：基准 composition 的 h5/h6 外距是 30px / 15px
    marginTop: 30,
    marginBottom: 15,
    ...overrides,
  });

  return {
    ...defaultVariables,

    // 页面：阅读版式统一 5px 22px 内距 + 677px 上限并居中
    fontFamily: defaultVariables.fontFamily,
    fontSize: "16px",
    lineHeight: String(rhythm),
    primaryColor: accent,
    primaryGradient: "",
    pageBackgroundColor: "transparent",
    pagePadding: 22,
    pagePaddingY: 5,
    pageMaxWidth: 677,
    baseLetterSpacing: 0,
    // 自包含输出必须在根节点给行高与断行，否则未声明的节点全部落到 normal
    rootTypography: true,

    // 段落：只有段后距
    paragraphMargin: paragraphGap,
    paragraphPadding: 0,
    paragraphMarginTop: 0,
    paragraphMarginBottom: paragraphGap,
    paragraphColor: ink,
    textIndent: false,
    textJustify: false,

    // 标题
    h1: {
      fontSize: 24,
      color: ink,
      fontWeight: "600",
      letterSpacing: 0,
      marginTop: 34,
      marginBottom: 22,
      centered: false,
      lineHeight: 1.5,
      ruleBelowWidth: 1,
      ruleBelowColor: rule,
      ruleBelowGap: 8,
    },
    h2: {
      fontSize: 20,
      color: ink,
      fontWeight: "600",
      letterSpacing: 0,
      marginTop: 0,
      marginBottom: 20,
      centered: false,
      lineHeight: 1.6,
      ...h2,
    },
    h3: {
      fontSize: 17,
      color: accent,
      fontWeight: "600",
      letterSpacing: 0,
      marginTop: 26,
      marginBottom: 12,
      centered: false,
      lineHeight: 1.7,
    },
    h4: {
      fontSize: 15,
      color: accent,
      fontWeight: "700",
      letterSpacing: 0,
      marginTop: 22,
      marginBottom: 10,
      centered: false,
      lineHeight: 1.6,
    },
    h5: minor({}),
    h6: minor({}),

    // 引用：悬挂缩进 16px、段间 10px
    quoteBackground: quote.background,
    quoteBorderColor: quote.borderColor,
    quoteTextColor: ink,
    quotePreset: "left-border",
    quoteBorderStyle: "solid",
    quoteBorderWidth: quote.borderWidth,
    quotePaddingX: quote.paddingXLeft,
    quotePaddingY: quote.paddingY,
    quotePaddingLeft: quote.paddingXLeft,
    quotePaddingRight: quote.paddingXRight,
    quoteFontSize: quote.fontSize,
    quoteLineHeight: quote.lineHeight,
    quoteTextCentered: false,
    quoteBorderEdges: quote.edgesTopBottom ? "top-bottom" : "left",
    quoteIndent: 16,
    quoteParagraphGap: 10,
    quoteOuterMargin: 26,
    quoteFontFamily: quote.fontFamily,

    // 正文内联样式
    strongStyle: "color",
    strongColor: ink,
    strongAccentColor: "",
    italicColor: ink,
    delColor: muted,
    delCoversStrikethrough: true,
    markBackground: markBg,
    markColor: ink,
    underlineStyle: "solid",
    underlineColor: "currentColor",
    linkColor: "",
    linkUnderline: true,
    linkUnderlineMode: "text",
    linkUnderlineOffset: 2,

    // 分隔线
    hrStyle: "solid",
    hrHeight: 1,
    hrColor: divider.color,
    hrMargin: divider.marginTop,
    hrMarginTop: divider.marginTop,
    hrMarginBottom: divider.marginBottom,
    hrWidth: divider.width ?? undefined,
    hrAlign: divider.width === null ? undefined : (divider.align ?? "center"),

    // 列表
    ulStyle: "disc",
    ulStyleL2: "circle",
    olStyle: "decimal",
    olStyleL2: "lower-alpha",
    listSpacing: 6,
    listLayout: "reading",
    listMarkerColor: ink,
    listMarkerColorL2: ink,
    ulFontSize: "inherit",
    olFontSize: "inherit",

    // 图片与滑动图片
    imageMargin: 26,
    imageBorderRadius: 0,
    imageShadow: false,
    imageLayout: "fill",
    imageflowLayout: "reading",
    imageCaptionColor: muted,
    imageCaptionFontSize: 12,
    imageCaptionTextAlign: "right",

    // 表格
    tableHeaderBackground: table.headerBackground ?? surface,
    tableHeaderColor: table.headerColor,
    tableBorderColor: table.borderColor,
    tableZebra: false,
    tableStyle: "rules",

    // 代码
    codeBackground: code.background,
    codeFontSize: 13,
    codeTheme: "github",
    showMacBar: false,
    codeBlockBorder: code.border,
    codeBlockBorderWidth: 1,
    codeBlockBorderColor: code.borderColor,
    codeBlockRadius: 4,
    codeBlockPaddingX: 16,
    codeBlockPaddingY: 14,
    codeBlockLineHeight: 1.75,
    codeBlockContainWidth: true,
    inlineCodeColor: code.color,
    inlineCodeBackground: code.background,
    inlineCodeStyle: "simple",
    inlineCodeFontSize: 13,
    inlineCodePaddingX: 4,
    inlineCodePaddingY: 1,
    inlineCodeBorderWidth: 1,

    // 提示块
    calloutStyle: "primary",
    calloutBackground: shape.calloutBackground ?? surface,
    calloutPaddingX: 16,
    calloutPaddingY: 14,
    calloutTitleFontSize: 13,
    calloutTitleColor: accent,
    calloutBodyFontSize: 13,
    calloutBodyColor: muted,

    // 脚注
    footnoteColor: muted,
    footnoteFontSize: 13,
    footnoteLayout: "hanging",
    footnoteNumberWidth: 22,
    footnoteLineHeight: 1.8,
    footnoteHeader: "参考资料",
    footnoteHeaderColor: accent,
    footnoteHeaderStyle: "plain",

    // 公式与 Mermaid
    equationMaxWidth: true,
    mermaidTheme: "base",
  };
};

export interface DesignerPreset {
  /** 与同名内置阅读版式共用 id，注册时用于替换其 CSS */
  id: string;
  name: string;
  tagline: string;
  variables: DesignerVariables;
}

export const plainPaperPreset: DesignerPreset = {
  id: "plain-paper",
  name: "素笺",
  tagline: "暖灰留白 · 适合长文与生活随笔",
  variables: buildEdition(
    {
      accent: "#756655",
      ink: "#3F3D39",
      muted: "#74706A",
      surface: "#F8F6F1",
      rule: "#E6E0D7",
      rhythm: 1.9,
      paragraphGap: 24,
      markBg: "#EFEAE2",
    },
    {
      h2: getReadingHeadingDefaults("reading-plain-paper"),
      quote: {
        background: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E6E0D7",
        edgesTopBottom: true,
        paddingY: 12,
        paddingXRight: 16,
        paddingXLeft: 32,
        fontSize: 16,
        lineHeight: 1.86,
      },
      divider: {
        color: "#C8BFB2",
        width: 28,
        align: "center",
        marginTop: 36,
        marginBottom: 14,
      },
      table: { headerColor: "#756655", borderColor: "#E6E0D7" },
      code: {
        background: "#FAF9F6",
        color: "#3F3D39",
        border: "full",
        borderColor: "#E6E0D7",
      },
    },
  ),
};

export const inkJournalPreset: DesignerPreset = {
  id: "ink-journal",
  name: "墨刊",
  tagline: "黑白刊物 · 适合深度报道与人物文章",
  variables: buildEdition(
    {
      accent: "#272727",
      ink: "#3C3C3A",
      muted: "#73736F",
      surface: "#F6F6F3",
      rule: "#E2E2DD",
      rhythm: 1.84,
      paragraphGap: 24,
      markBg: "#EAEAE6",
    },
    {
      h2: getReadingHeadingDefaults("reading-ink-journal"),
      quote: {
        background: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#B6B6B2",
        paddingY: 6,
        paddingXRight: 0,
        paddingXLeft: 24,
        fontSize: 17,
        lineHeight: 1.85,
        fontFamily: SERIF,
      },
      divider: {
        color: "#464644",
        width: null,
        marginTop: 34,
        marginBottom: 16,
      },
      table: {
        headerBackground: "#FFFFFF",
        headerColor: "#303030",
        borderColor: "#E2E2DD",
      },
      code: {
        background: "#F8F8F6",
        color: "#3C3C3A",
        border: "left",
        borderColor: "#CFCFCB",
      },
    },
  ),
};

export const jadeNotesPreset: DesignerPreset = {
  id: "jade-notes",
  name: "青岚",
  tagline: "松青书页 · 适合随笔、人文与知识长文",
  variables: buildEdition(
    {
      accent: "#27675C",
      ink: "#3D4841",
      muted: "#6D786F",
      surface: "#F4F7F4",
      rule: "#DDE7DF",
      rhythm: 1.92,
      paragraphGap: 25,
      markBg: "#E4EDE6",
    },
    {
      h2: getReadingHeadingDefaults("reading-jade-notes"),
      quote: {
        background: "#F4F8F5",
        borderWidth: 0,
        borderColor: "#DDE7DF",
        paddingY: 14,
        paddingXRight: 16,
        paddingXLeft: 32,
        fontSize: 16,
        lineHeight: 1.9,
      },
      divider: {
        color: "#DDE7DF",
        width: null,
        marginTop: 34,
        marginBottom: 16,
      },
      table: { headerColor: "#27675C", borderColor: "#DDE7DF" },
      code: {
        background: "#F3F7F4",
        color: "#3B5548",
        border: "full",
        borderColor: "#DDE7DF",
      },
      calloutBackground: "#F4F8F5",
    },
  ),
};

export const blueprintPreset: DesignerPreset = {
  id: "blueprint",
  name: "蓝图",
  tagline: "理性蓝调 · 适合科技、方法与数据解读",
  variables: buildEdition(
    {
      accent: "#2857B7",
      ink: "#3B424D",
      muted: "#6D7684",
      surface: "#F1F5FC",
      rule: "#DFE6F1",
      rhythm: 1.84,
      paragraphGap: 22,
      markBg: "#E3EAF7",
    },
    {
      h2: getReadingHeadingDefaults("reading-blueprint"),
      quote: {
        background: "#FFFFFF",
        borderWidth: 2,
        borderColor: "#ABC0E5",
        paddingY: 8,
        paddingXRight: 0,
        paddingXLeft: 24,
        fontSize: 16,
        lineHeight: 1.85,
      },
      divider: {
        color: "#DFE6F1",
        width: null,
        marginTop: 32,
        marginBottom: 16,
      },
      table: { headerColor: "#2857B7", borderColor: "#DFE6F1" },
      code: {
        background: "#F6F8FC",
        color: "#3B424D",
        border: "full",
        borderColor: "#DFE6F1",
      },
    },
  ),
};

export const cinnabarPreset: DesignerPreset = {
  id: "cinnabar",
  name: "朱砂",
  tagline: "砖红篇章 · 适合观点、文化与品牌故事",
  variables: buildEdition(
    {
      accent: "#A3453C",
      ink: "#443B38",
      muted: "#7A6D69",
      surface: "#FBF6F3",
      rule: "#EBE1DB",
      rhythm: 1.88,
      paragraphGap: 24,
      markBg: "#F2E4DF",
    },
    {
      h2: getReadingHeadingDefaults("reading-cinnabar"),
      quote: {
        background: "#FCF8F5",
        borderWidth: 0,
        borderColor: "#EBE1DB",
        paddingY: 14,
        paddingXRight: 16,
        paddingXLeft: 32,
        fontSize: 16,
        lineHeight: 1.88,
      },
      divider: {
        color: "#BB796F",
        width: 28,
        align: "left",
        marginTop: 36,
        marginBottom: 16,
      },
      table: { headerColor: "#A3453C", borderColor: "#EBE1DB" },
      code: {
        background: "#FBF8F5",
        color: "#443B38",
        border: "full",
        borderColor: "#EBE1DB",
      },
    },
  ),
};

/** Stage 4 的模板入口按这个顺序展示 */
export const designerPresets: DesignerPreset[] = [
  plainPaperPreset,
  inkJournalPreset,
  jadeNotesPreset,
  blueprintPreset,
  cinnabarPreset,
];
