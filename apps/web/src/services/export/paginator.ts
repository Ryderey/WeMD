/**
 * 切图分页器（纯函数，不含 DOM 依赖，便于单测）
 * 按原子块高度累加分页：放不下一块即换页；单块超页高标记为超长块
 */

export interface RatioPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

/** 比例预设，3:4 为默认 */
export const RATIO_PRESETS: readonly RatioPreset[] = [
  { id: "3:4", label: "3:4", width: 1080, height: 1440 },
  { id: "1:1", label: "1:1", width: 1080, height: 1080 },
  { id: "4:3", label: "4:3", width: 1200, height: 900 },
  { id: "9:16", label: "9:16", width: 1080, height: 1920 },
];

export const DEFAULT_RATIO_ID = "3:4";

/** 页面视觉参数的基准宽度，其他宽度按比例缩放 */
export const BASE_PAGE_WIDTH = 1080;

export interface PageLayout {
  pageWidth: number;
  pageHeight: number;
  /** 左右页边距 */
  marginX: number;
  marginTop: number;
  /** 下边距含页脚区 */
  marginBottom: number;
  footerHeight: number;
  footerFontSize: number;
}

/**
 * 依据目标页尺寸生成页面布局参数
 * 1080 宽基准：左右边距 80、上下边距 96、页脚高 64、页脚字号 24
 */
export function getPageLayout(
  pageWidth: number,
  pageHeight: number,
): PageLayout {
  const scale = pageWidth / BASE_PAGE_WIDTH;
  return {
    pageWidth,
    pageHeight,
    marginX: Math.round(80 * scale),
    marginTop: Math.round(96 * scale),
    marginBottom: Math.round(96 * scale),
    footerHeight: Math.round(64 * scale),
    footerFontSize: Math.round(24 * scale),
  };
}

/** 页内内容可用高度（扣除上下边距，页脚位于下边距区域内） */
export function getAvailableHeight(layout: PageLayout): number {
  return layout.pageHeight - layout.marginTop - layout.marginBottom;
}

export interface BlockMeasure {
  /** 原子块在内容容器中的序号 */
  index: number;
  /** 实测渲染高度（含块间留白） */
  height: number;
}

export interface PagePlan {
  /** 每页包含的块序号，按文档顺序 */
  pages: number[][];
  /** 超出页可用高度的块序号 */
  oversized: number[];
}

/**
 * 按块分页：按文档顺序累加块高度，放不下一块即换页
 * 超长块独占一页，由调用方决定是否等比缩小
 */
export function planPages(
  blocks: BlockMeasure[],
  layout: PageLayout,
): PagePlan {
  const availableHeight = getAvailableHeight(layout);
  const pages: number[][] = [];
  const oversized: number[] = [];
  let currentPage: number[] = [];
  let usedHeight = 0;

  const flush = () => {
    if (currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      usedHeight = 0;
    }
  };

  for (const block of blocks) {
    if (block.height > availableHeight) {
      oversized.push(block.index);
      flush();
      pages.push([block.index]);
      continue;
    }
    if (currentPage.length > 0 && usedHeight + block.height > availableHeight) {
      flush();
    }
    currentPage.push(block.index);
    usedHeight += block.height;
  }
  flush();

  return { pages, oversized };
}

/**
 * 超长块等比缩小到单页的缩放比例
 * 返回值位于 (0, 1)；块未超长时返回 1
 */
export function getOversizedScale(
  blockHeight: number,
  layout: PageLayout,
): number {
  const availableHeight = getAvailableHeight(layout);
  if (blockHeight <= availableHeight) return 1;
  return availableHeight / blockHeight;
}

/** 小红书单篇图片上限 */
export const XIAOHONGSHU_MAX_IMAGES = 18;

/** canvas 最大安全高度（浏览器约 16384px） */
export const MAX_CANVAS_HEIGHT = 16384;
