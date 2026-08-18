/**
 * 页脚装饰渲染
 * 方案 A（无水印）：页码「1 / N」居中
 * 方案 B（有水印）：左页码「1 / N」右水印文本
 */

import type { PageLayout } from "./paginator";

export interface FooterOptions {
  /** 当前页码，从 1 开始 */
  pageIndex: number;
  totalPages: number;
  /** 水印文字，留空走方案 A */
  watermark?: string;
  layout: PageLayout;
}

const FOOTER_COLOR = "#999999";

/**
 * 生成页脚元素，由导出管线放置在页容器底部
 * 不修改内容 DOM，页脚独立于正文
 */
export function createFooterElement(options: FooterOptions): HTMLElement {
  const { pageIndex, totalPages, watermark, layout } = options;
  const footer = document.createElement("div");
  footer.className = "wemd-export-footer";
  footer.style.position = "absolute";
  footer.style.left = "0";
  footer.style.right = "0";
  footer.style.bottom = "0";
  footer.style.height = `${layout.footerHeight}px`;
  footer.style.padding = `0 ${layout.marginX}px`;
  footer.style.display = "flex";
  footer.style.alignItems = "center";
  footer.style.color = FOOTER_COLOR;
  footer.style.fontSize = `${layout.footerFontSize}px`;
  footer.style.lineHeight = "1";
  footer.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif";

  const pageLabel = document.createElement("span");
  pageLabel.textContent = `${pageIndex} / ${totalPages}`;

  const trimmedWatermark = watermark?.trim();
  if (!trimmedWatermark) {
    // 方案 A：页码居中
    footer.style.justifyContent = "center";
    footer.appendChild(pageLabel);
    return footer;
  }

  // 方案 B：左页码右水印
  footer.style.justifyContent = "space-between";
  const watermarkLabel = document.createElement("span");
  watermarkLabel.textContent = trimmedWatermark;
  watermarkLabel.style.maxWidth = "60%";
  watermarkLabel.style.overflow = "hidden";
  watermarkLabel.style.textOverflow = "ellipsis";
  watermarkLabel.style.whiteSpace = "nowrap";
  footer.appendChild(pageLabel);
  footer.appendChild(watermarkLabel);
  return footer;
}
