/**
 * 微信复制链路的引用块滑动支持。
 *
 * 主题生成的 CSS 规则会让引用在预览里可滚，但微信编辑器只认内联样式，
 * 因此复制时需要在 juice 内联之后逐个 blockquote 补写滚动声明；
 * 溢出的引用再补一行「▲上下滑动查看全文」提示（对齐上游文章的结构）。
 */

export const QUOTE_SCROLL_HINT_TEXT = "▲上下滑动查看全文";

/** jsdom 等无布局环境的字数回退阈值 */
const LONG_QUOTE_FALLBACK_CHARS = 200;

const QUOTE_SCROLL_PROPERTIES = [
  "max-height",
  "overflow-y",
  "overflow-x",
  "-webkit-overflow-scrolling",
];

const applyQuoteScrollStyles = (el: HTMLElement, maxHeight: number): void => {
  el.style.setProperty("max-height", `${maxHeight}px`);
  el.style.setProperty("overflow-y", "auto");
  el.style.setProperty("overflow-x", "hidden");
  el.style.setProperty("-webkit-overflow-scrolling", "touch");
};

export const removeQuoteScrollStyles = (el: HTMLElement): void => {
  for (const property of QUOTE_SCROLL_PROPERTIES) {
    el.style.removeProperty(property);
  }
};

const shouldShowHint = (el: HTMLElement): boolean => {
  if (el.clientHeight === 0) {
    // 无真实布局（jsdom/离线序列化）：回退字数阈值，测试可断言。
    return (el.textContent ?? "").trim().length >= LONG_QUOTE_FALLBACK_CHARS;
  }
  return el.scrollHeight > el.clientHeight;
};

const createHintSection = (): HTMLElement => {
  const section = document.createElement("section");
  section.style.cssText = "margin: 6px 0 24px; text-align: center;";
  const span = document.createElement("span");
  span.style.cssText = "font-size: 12px;";
  span.textContent = QUOTE_SCROLL_HINT_TEXT;
  section.appendChild(span);
  return section;
};

export const applyWechatQuoteScroll = (
  container: HTMLElement,
  maxHeight: number,
): void => {
  container.querySelectorAll<HTMLElement>("blockquote").forEach((el) => {
    applyQuoteScrollStyles(el, maxHeight);
    if (shouldShowHint(el)) {
      el.after(createHintSection());
    }
  });
};

export const stripQuoteScroll = (container: HTMLElement): void => {
  container.querySelectorAll<HTMLElement>("blockquote").forEach((el) => {
    removeQuoteScrollStyles(el);
  });
};
