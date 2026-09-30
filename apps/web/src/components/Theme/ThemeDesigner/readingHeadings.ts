import type { HeadingStyle } from "./types";
import { optionalLength, optionalHexColor } from "./generators/safeCssValue";

const SANS = "PingFang SC, Microsoft YaHei, Arial, sans-serif";
const SERIF = "Songti SC, Noto Serif CJK SC, SimSun, serif";
const MONO = "Menlo, Consolas, monospace";

interface ReadingHeadingPreset {
  id: string;
  label: string;
  heading: Partial<HeadingStyle>;
  layout: "stacked" | "hanging";
  numberFont: string;
  numberSize: number;
  numberColor: string;
  numberWeight: number;
  numberLineHeight: number;
  numberSpacing: number;
  numberGap: number;
  numberWidth?: number;
  numberRuleColor?: string;
  ruleColor: string;
  ruleWidth?: number;
  ruleCentered?: boolean;
  ruleMarginTop: number;
  ruleMarginBottom: number;
}

/** WeDraft reading-editions.ts defaults; numbers and rules are authored spans. */
export const readingHeadingPresets: ReadingHeadingPreset[] = [
  {
    id: "reading-plain-paper",
    label: "素笺编号",
    heading: {
      fontSize: 21,
      color: "#3F3D39",
      lineHeight: 1.55,
      letterSpacing: 0.5,
      centered: true,
    },
    layout: "stacked",
    numberFont: SERIF,
    numberSize: 13,
    numberColor: "#756655",
    numberWeight: 400,
    numberLineHeight: 1.4,
    numberSpacing: 1,
    numberGap: 6,
    ruleColor: "#C8BFB2",
    ruleWidth: 28,
    ruleCentered: true,
    ruleMarginTop: 36,
    ruleMarginBottom: 14,
  },
  {
    id: "reading-ink-journal",
    label: "墨刊编号",
    heading: {
      fontSize: 22,
      color: "#272727",
      lineHeight: 1.55,
      fontFamily: SERIF,
    },
    layout: "hanging",
    numberFont: MONO,
    numberSize: 12,
    numberColor: "#272727",
    numberWeight: 400,
    numberLineHeight: 1.4,
    numberSpacing: 0,
    numberGap: 6,
    numberWidth: 26,
    ruleColor: "#464644",
    ruleMarginTop: 34,
    ruleMarginBottom: 16,
  },
  {
    id: "reading-jade-notes",
    label: "青岚编号",
    heading: { fontSize: 20, color: "#27675C", lineHeight: 1.6 },
    layout: "stacked",
    numberFont: SANS,
    numberSize: 12,
    numberColor: "#27675C",
    numberWeight: 400,
    numberLineHeight: 1.4,
    numberSpacing: 1,
    numberGap: 8,
    numberWidth: 22,
    numberRuleColor: "#B8CDC3",
    ruleColor: "#DDE7DF",
    ruleMarginTop: 34,
    ruleMarginBottom: 16,
  },
  {
    id: "reading-blueprint",
    label: "蓝图编号",
    heading: { fontSize: 20, color: "#2F3540", lineHeight: 1.55 },
    layout: "hanging",
    numberFont: MONO,
    numberSize: 12,
    numberColor: "#2857B7",
    numberWeight: 500,
    numberLineHeight: 1.4,
    numberSpacing: 0,
    numberGap: 0,
    numberWidth: 28,
    ruleColor: "#DFE6F1",
    ruleMarginTop: 32,
    ruleMarginBottom: 16,
  },
  {
    id: "reading-cinnabar",
    label: "朱砂编号",
    heading: { fontSize: 21, color: "#443B38", lineHeight: 1.55 },
    layout: "hanging",
    numberFont: SERIF,
    numberSize: 22,
    numberColor: "#A3453C",
    numberWeight: 400,
    numberLineHeight: 1.3,
    numberSpacing: 0,
    numberGap: 6,
    numberWidth: 36,
    ruleColor: "#BB796F",
    ruleWidth: 28,
    ruleMarginTop: 36,
    ruleMarginBottom: 16,
  },
];

export const getReadingHeadingPreset = (id: unknown) =>
  readingHeadingPresets.find((preset) => preset.id === id);

export function getReadingHeadingDefaults(presetId: string): HeadingStyle {
  const preset = getReadingHeadingPreset(presetId);
  if (!preset) throw new Error(`Unknown reading heading preset: ${presetId}`);
  return {
    fontSize: 20,
    color: "#333333",
    fontFamily: SANS,
    lineHeight: 1.6,
    fontWeight: "600",
    letterSpacing: 0,
    centered: false,
    marginTop: 0,
    marginBottom: 20,
    ruleBelowWidth: 0,
    ...preset.heading,
    preset: preset.id,
    numberFontSize: preset.numberSize,
    numberColor: preset.numberColor,
    numberGap: preset.numberGap,
    numberWidth: preset.numberWidth,
  };
}

export const resolveReadingHeadingNumbers = (
  preset: ReadingHeadingPreset,
  heading?: HeadingStyle,
) => ({
  fontSize: optionalLength(heading?.numberFontSize, 48, 8) ?? preset.numberSize,
  color: optionalHexColor(heading?.numberColor) ?? preset.numberColor,
  gap: optionalLength(heading?.numberGap, 40) ?? preset.numberGap,
  width: optionalLength(heading?.numberWidth, 120, 12) ?? preset.numberWidth,
});

export const getReadingHeadingSnippet = (preset: ReadingHeadingPreset) =>
  `<span class="reading-heading ${preset.id}"><span class="heading-rule">&nbsp;</span><span class="heading-body"><span class="heading-number">01</span><span class="heading-text">建立阅读层级</span></span></span>`;
