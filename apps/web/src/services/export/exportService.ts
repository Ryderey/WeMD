/**
 * 导出图片编排服务
 * 单张长图 / 切图两种模式的页面构建、截图、打包与保存
 */

import { domToBlob, domToDataUrl } from "modern-screenshot";
import JSZip from "jszip";
import {
  renderOffscreenContent,
  getContentBackground,
} from "./renderContainer";
import {
  getPageLayout,
  getAvailableHeight,
  planPages,
  getOversizedScale,
  MAX_CANVAS_HEIGHT,
  type PageLayout,
  type BlockMeasure,
} from "./paginator";
import { createFooterElement } from "./footerRenderer";
import { applyWechatPreviewCache } from "../image/wechatPreviewCache";

export type ExportMode = "long" | "paged";
export type ExportFormat = "png" | "jpeg";

export interface ExportSettings {
  /** long=单张长图，paged=切图 */
  mode: ExportMode;
  /** 切图比例预设 id */
  ratioId: string;
  /** 水印文字，留空走方案 A */
  watermark: string;
  format: ExportFormat;
}

export interface BuiltExport {
  /** 页容器列表（长图模式仅 1 个） */
  pages: HTMLElement[];
  layout: PageLayout;
  /** 超长块数量（仅切图模式） */
  oversizedCount: number;
  totalPages: number;
  background: string;
  /** 释放离屏 DOM */
  dispose: () => void;
}

/** 长图总高超出 canvas 上限时抛出，UI 层提示切换切图 */
export class ExportTooTallError extends Error {
  constructor(public readonly contentHeight: number) {
    super("内容总高度超出浏览器画布上限");
    this.name = "ExportTooTallError";
  }
}

const IMAGE_WAIT_TIMEOUT_MS = 10000;

// ── 图片资源处理 ──────────────────────────────────────

const isLocalUrl = (url: string) =>
  url.startsWith("data:") || url.startsWith("blob:");

/**
 * 将远程图片转为同源可绘制的 objectURL，避免 canvas 污染
 * 先走微信图床缓存，再尝试 fetch；返回失败数量
 */
export async function localizeImages(root: HTMLElement): Promise<number> {
  await applyWechatPreviewCache(root);

  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  let failed = 0;
  await Promise.all(
    images.map(async (image) => {
      const src = image.getAttribute("src");
      if (!src || isLocalUrl(src)) return;
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        image.src = URL.createObjectURL(blob);
      } catch {
        failed += 1;
      }
    }),
  );
  return failed;
}

/** 等待图片解码完成，超时不阻断 */
const waitForImages = async (root: HTMLElement): Promise<void> => {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  const tasks = images.map((image) =>
    image.complete
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
  );
  await Promise.race([
    Promise.all(tasks),
    new Promise<void>((resolve) => setTimeout(resolve, IMAGE_WAIT_TIMEOUT_MS)),
  ]);
};

// ── 页面构建 ──────────────────────────────────────

const createPageElement = (
  layout: PageLayout,
  background: string,
): HTMLElement => {
  const page = document.createElement("div");
  page.style.position = "relative";
  page.style.width = `${layout.pageWidth}px`;
  page.style.height = `${layout.pageHeight}px`;
  page.style.overflow = "hidden";
  page.style.backgroundColor = background;
  page.style.colorScheme = "light";
  page.style.boxSizing = "border-box";
  page.style.padding = `${layout.marginTop}px ${layout.marginX}px ${layout.marginBottom}px`;
  return page;
};

/** 克隆原子块到页面；超长块套 wrapper 等比缩小 */
const appendBlockToPage = (
  page: HTMLElement,
  block: HTMLElement,
  blockHeight: number,
  layout: PageLayout,
): void => {
  const scale = getOversizedScale(blockHeight, layout);
  if (scale >= 1) {
    page.appendChild(block.cloneNode(true));
    return;
  }
  const wrapper = document.createElement("div");
  wrapper.style.height = `${Math.ceil(blockHeight * scale)}px`;
  wrapper.style.overflow = "hidden";
  const cloned = block.cloneNode(true) as HTMLElement;
  cloned.style.transform = `scale(${scale})`;
  cloned.style.transformOrigin = "top center";
  wrapper.appendChild(cloned);
  page.appendChild(wrapper);
};

/** 按相邻块 offsetTop 差测量块高（含块间留白） */
const measureBlocks = (contentRoot: HTMLElement): BlockMeasure[] => {
  const blocks = Array.from(contentRoot.children) as HTMLElement[];
  return blocks.map((block, index) => {
    const next = blocks[index + 1];
    const height = next
      ? next.offsetTop - block.offsetTop
      : block.offsetTop + block.offsetHeight;
    return { index, height: Math.ceil(height) };
  });
};

const buildPagedPages = (
  contentRoot: HTMLElement,
  layout: PageLayout,
  background: string,
  watermark: string,
): { pages: HTMLElement[]; oversizedCount: number } => {
  const blocks = Array.from(contentRoot.children) as HTMLElement[];
  const measures = measureBlocks(contentRoot);
  const plan = planPages(measures, layout);
  const totalPages = plan.pages.length;

  const pages = plan.pages.map((blockIndexes, pageIndex) => {
    const page = createPageElement(layout, background);
    for (const blockIndex of blockIndexes) {
      appendBlockToPage(
        page,
        blocks[blockIndex],
        measures[blockIndex].height,
        layout,
      );
    }
    page.appendChild(
      createFooterElement({
        pageIndex: pageIndex + 1,
        totalPages,
        watermark,
        layout,
      }),
    );
    return page;
  });

  return { pages, oversizedCount: plan.oversized.length };
};

const buildLongPage = (
  contentRoot: HTMLElement,
  layout: PageLayout,
  background: string,
): HTMLElement[] => {
  const contentHeight = contentRoot.scrollHeight;
  const totalHeight = contentHeight + layout.marginTop + layout.marginBottom;
  if (totalHeight > MAX_CANVAS_HEIGHT) {
    throw new ExportTooTallError(totalHeight);
  }
  const page = createPageElement(layout, background);
  page.style.height = `${totalHeight}px`;
  // 长图为连续单图，不加页脚
  page.appendChild(contentRoot.cloneNode(true));
  return [page];
};

/**
 * 渲染并构建导出页面（挂载到离屏宿主）
 * 预览与正式导出共用，仅截图 scale 不同
 */
export async function buildExport(
  markdown: string,
  css: string,
  settings: ExportSettings,
  pageSize: { width: number; height: number },
): Promise<BuiltExport> {
  const layout = getPageLayout(pageSize.width, pageSize.height);
  // 内容区宽度 = 页宽扣除左右边距，保证测量与页面布局一致
  const contentWidth = layout.pageWidth - layout.marginX * 2;

  const { container: source, dispose: disposeSource } =
    await renderOffscreenContent(markdown, css, {
      widthPx: contentWidth,
      forWechat: false,
    });

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  host.style.opacity = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";
  document.body.appendChild(host);

  const dispose = () => {
    host.remove();
    disposeSource();
  };

  try {
    await localizeImages(source);
    await waitForImages(source);
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const contentRoot =
      (source.firstElementChild as HTMLElement | null) ?? source;
    const background = getContentBackground(source);

    const pages =
      settings.mode === "paged"
        ? buildPagedPages(contentRoot, layout, background, settings.watermark)
        : {
            pages: buildLongPage(contentRoot, layout, background),
            oversizedCount: 0,
          };

    pages.pages.forEach((page) => host.appendChild(page));

    return {
      pages: pages.pages,
      layout,
      oversizedCount: pages.oversizedCount,
      totalPages: pages.pages.length,
      background,
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

// ── 截图与输出 ──────────────────────────────────────

export interface CaptureOptions {
  /** 截图缩放，预览用低值 */
  scale?: number;
  format?: ExportFormat;
}

/** 逐页截图为 Blob，顺序执行避免大 canvas 峰值内存叠加 */
export async function capturePages(
  built: BuiltExport,
  options: CaptureOptions = {},
): Promise<Blob[]> {
  const { scale = 1, format = "png" } = options;
  const blobs: Blob[] = [];
  for (const page of built.pages) {
    const blob = await domToBlob(page, {
      scale,
      backgroundColor: built.background,
      type: format === "jpeg" ? "image/jpeg" : "image/png",
      quality: 0.92,
    });
    blobs.push(blob);
  }
  return blobs;
}

export interface ExportedFile {
  filename: string;
  blob: Blob;
}

const pad2 = (value: number) => String(value).padStart(2, "0");

/** 文件名安全化：剔除 Windows 非法字符 */
const sanitizeTitle = (title: string): string =>
  title.replace(/[\\/:*?"<>|]/g, "_").trim() || "WeMD";

/** 从当前文件路径提取标题，无文件回退 WeMD */
export function resolveExportTitle(currentFilePath?: string): string {
  if (!currentFilePath) return "WeMD";
  const base = currentFilePath.replace(/\\/g, "/").split("/").pop() || "";
  const withoutExt = base.replace(/\.[^.]+$/, "");
  return sanitizeTitle(withoutExt || "WeMD");
}

/** 生成导出文件基础名：WeMD-{标题}-{yyyyMMdd-HHmm} */
export function buildExportBaseName(title: string, now = new Date()): string {
  const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(
    now.getDate(),
  )}-${pad2(now.getHours())}${pad2(now.getMinutes())}`;
  return `WeMD-${sanitizeTitle(title)}-${stamp}`;
}

const formatExt = (format: ExportFormat) => (format === "jpeg" ? "jpg" : "png");

/** 为 Blob 列表生成带序号的文件名 */
export function buildFileNames(
  baseName: string,
  count: number,
  format: ExportFormat,
): string[] {
  if (count === 1) return [`${baseName}.${formatExt(format)}`];
  return Array.from({ length: count }, (_, index) => {
    const order = String(index + 1).padStart(2, "0");
    return `${order}.${formatExt(format)}`;
  });
}

// ── Web 下载 ──────────────────────────────────────

const triggerDownload = (url: string, filename: string): void => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

/** 单文件直接下载 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** 多文件 ZIP 打包下载，返回 ZIP 文件名 */
export async function downloadAsZip(
  files: ExportedFile[],
  zipName: string,
): Promise<string> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.filename, file.blob);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const fullZipName = `${zipName}.zip`;
  downloadBlob(blob, fullZipName);
  return fullZipName;
}

// ── Electron 保存 ──────────────────────────────────────

const blobToBase64 = async (blob: Blob): Promise<string> => {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return btoa(binary);
};

export interface ElectronSaveResult {
  success: boolean;
  path?: string;
  canceled?: boolean;
  error?: string;
}

/** 通过 Electron IPC 保存（单张另存 / 多张选目录），非 Electron 环境返回 null */
export async function saveViaElectron(
  files: ExportedFile[],
  defaultName: string,
): Promise<ElectronSaveResult | null> {
  const saveImages = window.electron?.export?.saveImages;
  if (!saveImages) return null;

  const payloadFiles = await Promise.all(
    files.map(async (file) => ({
      filename: file.filename,
      base64: await blobToBase64(file.blob),
    })),
  );
  return saveImages({ files: payloadFiles, defaultName });
}

// ── 高度校验辅助 ──────────────────────────────────────

/** 长图总高是否超 canvas 上限（供预览阶段提示） */
export function isLongImageTooTall(totalHeight: number): boolean {
  return totalHeight > MAX_CANVAS_HEIGHT;
}

/** 切图页高预算（供 UI 展示） */
export function getPageContentBudget(width: number, height: number): number {
  return getAvailableHeight(getPageLayout(width, height));
}
