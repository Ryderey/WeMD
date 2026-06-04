const MAC_SIGN_SELECTOR = ".mac-sign";
const WEMD_PRE_SELECTOR = "#wemd pre";
const APPLE_CODE_BAR_FALLBACK = "radial-gradient(circle at 18px 17px";

export function shouldRenderMacCodeBarNode(
  css: string,
  explicitShowMacBar?: boolean,
): boolean {
  if (explicitShowMacBar === true) {
    return true;
  }

  const normalizedCss = (css || "").replace(/\s+/g, " ").toLowerCase();

  if (normalizedCss.includes(MAC_SIGN_SELECTOR)) {
    return true;
  }

  return (
    normalizedCss.includes(WEMD_PRE_SELECTOR) &&
    normalizedCss.includes(APPLE_CODE_BAR_FALLBACK)
  );
}
