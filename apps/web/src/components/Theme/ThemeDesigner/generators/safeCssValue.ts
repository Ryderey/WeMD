/**
 * 设计器可选值的运行时校验。
 *
 * 主题变量可能来自 localStorage 或导入的 JSON，属于运行时输入：未通过校验的值一律按
 * 「未设置」处理，让生成器走原有规则。任何字符串都不允许未经校验就拼进 CSS。
 */

const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

// 字体栈只允许名称、引号、逗号、数字、连字符与点；出现 ; } < 等一律拒绝。
const FONT_STACK = /^[A-Za-z0-9 ,.'"\-_]+$/;

export const optionalLength = (
  value: unknown,
  max: number,
  min = 0,
): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min) {
    return null;
  }
  if (value > max) return null;
  return Math.round(value * 100) / 100;
};

/** 无单位倍数，用于行高等。 */
export const optionalUnitless = (
  value: unknown,
  min: number,
  max: number,
): number | null => {
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (value.trim() !== "" && Number.isFinite(parsed)) {
      value = parsed;
    }
  }
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return Math.round(value * 100) / 100;
};

export const optionalHexColor = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return HEX_COLOR.test(trimmed) ? trimmed : null;
};

/**
 * 字体栈。与全局字体一致地把双引号换成单引号，避免提前闭合声明。
 * 拒绝任何含分隔符或标签字符的值。
 */
export const optionalFontStack = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return null;
  if (!FONT_STACK.test(trimmed)) return null;
  return trimmed.replace(/"/g, "'");
};
