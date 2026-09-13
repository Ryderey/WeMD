const FITTED_CLASS = "inline-equation--fitted";

const getEquationContent = (
  wrapper: HTMLElement,
): HTMLElement | SVGElement | null =>
  wrapper.querySelector<HTMLElement>(".katex") ??
  wrapper.querySelector<SVGElement>("svg");

const resetInlineEquationFit = (wrapper: HTMLElement): void => {
  wrapper.classList.remove(FITTED_CLASS);
  wrapper.style.removeProperty("display");
  wrapper.style.removeProperty("max-width");
  wrapper.style.removeProperty("vertical-align");
  wrapper.style.removeProperty("width");
  wrapper.style.removeProperty("height");
  wrapper.style.removeProperty("overflow");

  const content = getEquationContent(wrapper);
  if (!content) return;

  const target = content as HTMLElement;
  target.style.removeProperty("display");
  target.style.removeProperty("transform-origin");
  target.style.removeProperty("transform");
};

/**
 * 将超出正文宽度的行内公式整体等比缩小，避免被预览画布裁切。
 * 适用于 KaTeX 行内公式；MathJax 行内 SVG 优先依赖 max-width: 100%。
 */
export const fitInlineEquations = (root: HTMLElement): void => {
  const wemd =
    root.querySelector<HTMLElement>("#wemd") ??
    (root.id === "wemd" ? root : null);
  if (!wemd) return;

  const containerRect = wemd.getBoundingClientRect();
  const containerWidth = wemd.clientWidth;
  if (containerWidth <= 0) return;

  wemd.querySelectorAll<HTMLElement>(".inline-equation").forEach((wrapper) => {
    resetInlineEquationFit(wrapper);

    const content = getEquationContent(wrapper);
    if (!content) return;

    const naturalWidth = content.scrollWidth;
    const wrapperRect = wrapper.getBoundingClientRect();
    const availableWidth = Math.min(
      containerWidth,
      Math.max(0, containerRect.right - wrapperRect.left),
    );

    if (naturalWidth <= availableWidth || availableWidth <= 0) return;

    const scale = availableWidth / naturalWidth;
    const naturalHeight = content.getBoundingClientRect().height;

    wrapper.classList.add(FITTED_CLASS);
    wrapper.style.display = "inline-block";
    wrapper.style.maxWidth = "100%";
    wrapper.style.verticalAlign = "middle";
    wrapper.style.width = `${naturalWidth * scale}px`;
    wrapper.style.height = `${naturalHeight * scale}px`;
    wrapper.style.overflow = "hidden";

    const target = content as HTMLElement;
    target.style.display = "inline-block";
    target.style.transformOrigin = "left center";
    target.style.transform = `scale(${scale})`;
  });
};
