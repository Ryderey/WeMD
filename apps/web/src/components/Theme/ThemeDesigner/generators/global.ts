import type { DesignerVariables } from "../types";
import { resolveStrongAccentColor } from "./strongAccent";

export function generateGlobal(v: DesignerVariables): string {
  const accent = resolveStrongAccentColor(v);
  const hasStrongTextColor = Boolean(
    v.strongColor && v.strongColor !== "inherit",
  );
  const useGradientText =
    Boolean(v.primaryGradient) &&
    v.strongStyle === "color" &&
    !hasStrongTextColor &&
    !accent;

  const strongColorRule = useGradientText
    ? "background-image: var(--wemd-primary-gradient); -webkit-background-clip: text; background-clip: text; color: transparent;"
    : hasStrongTextColor
      ? `color: ${v.strongColor};`
      : v.strongStyle === "none"
        ? "color: inherit;"
        : accent
          ? "color: var(--wemd-strong-accent-color);"
          : "color: var(--wemd-primary-color);";

  const highlighterRule =
    v.strongStyle === "highlighter"
      ? `background: ${
          accent
            ? "var(--wemd-strong-accent-color-12)"
            : "var(--wemd-primary-gradient-20)"
        }; padding: 0 2px; border-radius: 2px;`
      : "";

  const highlighterBottomRule =
    v.strongStyle === "highlighter-bottom"
      ? `background: linear-gradient(to bottom, transparent 60%, ${
          accent
            ? "var(--wemd-strong-accent-color-18)"
            : "var(--wemd-primary-color-30)"
        } 60%); padding: 0 2px;`
      : "";

  // Border longhands only in accent mode: WeChat's copy pipeline drops shorthand +
  // var() combinations, but the follow-theme shorthand must stay byte-identical for
  // existing themes.
  const underlineRule =
    v.strongStyle === "underline"
      ? accent
        ? `border-bottom-width: 2px; border-bottom-style: solid; border-bottom-color: var(--wemd-strong-accent-color); padding-bottom: 1px;`
        : `border-bottom: 2px solid var(--wemd-primary-color); padding-bottom: 1px;`
      : "";

  const dotRule =
    v.strongStyle === "dot"
      ? `-webkit-text-emphasis: dot; -webkit-text-emphasis-position: under; text-emphasis: dot; text-emphasis-position: under;${
          accent
            ? " -webkit-text-emphasis-color: var(--wemd-strong-accent-color); text-emphasis-color: var(--wemd-strong-accent-color);"
            : ""
        }`
      : "";

  return `#wemd figcaption {
  color: var(--wemd-image-caption-color);
  font-size: var(--wemd-image-caption-font-size);
  text-align: var(--wemd-image-caption-align);
  margin-top: 8px;
  line-height: var(--wemd-line-height);
}

#wemd strong { 
  font-weight: bold;
  ${strongColorRule}
  ${highlighterRule}
  ${highlighterBottomRule}
  ${underlineRule}
  ${dotRule}
}`;
}
