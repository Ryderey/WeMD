/**
 * 设计器可选数值字段的安全取值。
 *
 * 主题变量可能来自 localStorage 或导入的 JSON，属于运行时输入：未通过校验的值一律按
 * 「未设置」处理，让生成器走原有规则，而不是把任意值拼进 CSS。
 */
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
