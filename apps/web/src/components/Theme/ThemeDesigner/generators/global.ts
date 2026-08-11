import type { DesignerVariables } from "../types";

export function generateGlobal(v: DesignerVariables): string {
  const useGradientText =
    Boolean(v.primaryGradient) &&
    v.strongStyle === "color" &&
    (!v.strongColor || v.strongColor === "inherit");

  return `#wemd figcaption {
  color: var(--wemd-image-caption-color);
  font-size: var(--wemd-image-caption-font-size);
  text-align: var(--wemd-image-caption-align);
  margin-top: 8px;
  line-height: var(--wemd-line-height);
}

#wemd strong { 
  font-weight: bold;
  ${
    useGradientText
      ? "background-image: var(--wemd-primary-gradient); -webkit-background-clip: text; background-clip: text; color: transparent;"
      : v.strongColor && v.strongColor !== "inherit"
        ? `color: ${v.strongColor};`
        : v.strongStyle === "none"
          ? "color: inherit;"
          : "color: var(--wemd-primary-color);"
  }
  ${v.strongStyle === "highlighter" ? "background: var(--wemd-primary-gradient-20); padding: 0 2px; border-radius: 2px;" : ""}
  ${v.strongStyle === "highlighter-bottom" ? "background: linear-gradient(to bottom, transparent 60%, var(--wemd-primary-color-30) 60%); padding: 0 2px;" : ""}
  ${v.strongStyle === "underline" ? "border-bottom: 2px solid var(--wemd-primary-color); padding-bottom: 1px;" : ""}
  ${v.strongStyle === "dot" ? `-webkit-text-emphasis: dot; -webkit-text-emphasis-position: under; text-emphasis: dot; text-emphasis-position: under;` : ""}
}`;
}
