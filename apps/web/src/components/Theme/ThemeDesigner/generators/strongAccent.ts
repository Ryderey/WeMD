import type { DesignerVariables } from "../types";

// ColorSelector emits #rgb / #rrggbb; toAlphaColor also handles #rgba / #rrggbbaa.
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * 有效则返回去空格后的纯色，否则返回 null 表示「跟随主题」。
 * 导入的旧 JSON 可能是任意类型，这里不做未经验证的字符串操作，也不把无效值带入 CSS。
 */
export function resolveStrongAccentColor(
  v: Pick<DesignerVariables, "strongAccentColor">,
): string | null {
  const value = v.strongAccentColor;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return HEX_COLOR.test(trimmed) ? trimmed : null;
}
