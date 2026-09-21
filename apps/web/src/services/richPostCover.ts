import { createMarkdownParser } from "@wemd/core";
import { domToBlob } from "modern-screenshot";

export const RICH_POST_COVER_WIDTH = 1080;
export const RICH_POST_COVER_HEIGHT = 1440;

// 闭引号跟随最后一个字的偏移（em）。写死坐标只在标题恰好排满时成立，
// 短标题会把引号留在画布下半部（见任务 09-21-fix-warm-quote-close-position）。
const CLOSE_QUOTE_GAP_EM = 0.08;
const CLOSE_QUOTE_DROP_EM = -0.62;

export type RichPostCoverTemplateId =
  | "warm-quote"
  | "cool-underline"
  | "burst-black";

export interface RichPostCoverSettings {
  templateId: RichPostCoverTemplateId;
  backgroundColor: string;
  accentColor: string;
}

export interface RichPostCoverPreset {
  id: RichPostCoverTemplateId;
  name: string;
  description: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  fontWeight: string;
  maxFontSize: number;
  minFontSize: number;
}

export interface RichPostCoverInput {
  title: string;
  highlightTerms: string[];
  settings: RichPostCoverSettings;
}

export const RICH_POST_COVER_PRESETS: Record<
  RichPostCoverTemplateId,
  RichPostCoverPreset
> = {
  "warm-quote": {
    id: "warm-quote",
    name: "暖白引语",
    description: "黑色粗体、黄色引号与关键词",
    backgroundColor: "#fffdf2",
    accentColor: "#f7bf00",
    textColor: "#161616",
    fontFamily: '"Noto Sans SC", sans-serif',
    fontWeight: "700",
    maxFontSize: 116,
    minFontSize: 52,
  },
  "cool-underline": {
    id: "cool-underline",
    name: "冷白手写",
    description: "蓝色文字、青色关键词下划线",
    backgroundColor: "#f4f8fc",
    accentColor: "#65e4d2",
    textColor: "#168ddd",
    fontFamily: '"LXGW WenKai Lite", cursive',
    fontWeight: "400",
    maxFontSize: 104,
    minFontSize: 48,
  },
  "burst-black": {
    id: "burst-black",
    name: "放射黑底",
    description: "黑底放射线、白色粗体与红色关键词",
    backgroundColor: "#1c1c1c",
    accentColor: "#f46550",
    textColor: "#ffffff",
    fontFamily: '"Noto Sans SC", sans-serif',
    fontWeight: "900",
    maxFontSize: 188,
    minFontSize: 52,
  },
};

export const DEFAULT_RICH_POST_COVER_SETTINGS: RichPostCoverSettings = {
  templateId: "warm-quote",
  backgroundColor: RICH_POST_COVER_PRESETS["warm-quote"].backgroundColor,
  accentColor: RICH_POST_COVER_PRESETS["warm-quote"].accentColor,
};

export class RichPostCoverOverflowError extends Error {
  constructor() {
    super("封面标题过长，请缩短仅用于首图的标题后再导出");
    this.name = "RichPostCoverOverflowError";
  }
}

export function resolveRichPostTitle(
  markdown: string,
  currentFilePath?: string,
): string {
  const tokens = createMarkdownParser().parse(markdown, {});
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].type !== "heading_open" || tokens[index].tag !== "h1") {
      continue;
    }
    const inline = tokens[index + 1];
    if (inline?.type !== "inline") continue;
    const title = (inline.children ?? [])
      .filter((token) =>
        ["text", "code_inline", "emoji", "softbreak"].includes(token.type),
      )
      .map((token) => (token.type === "softbreak" ? " " : token.content))
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (title) return title;
  }

  const basename = (currentFilePath ?? "")
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .trim();
  return basename || "未命名文章";
}

export function normalizeHighlightTerms(
  title: string,
  terms: readonly string[],
): string[] {
  const normalized: string[] = [];
  for (const candidate of terms) {
    const term = candidate.trim();
    if (!term || !title.includes(term) || normalized.includes(term)) continue;
    normalized.push(term);
    if (normalized.length === 2) break;
  }
  return normalized;
}

export function createRichPostCoverElement(
  input: RichPostCoverInput,
): HTMLElement {
  const preset = RICH_POST_COVER_PRESETS[input.settings.templateId];
  const root = document.createElement("div");
  root.dataset.richPostCover = input.settings.templateId;
  setStyles(root, {
    position: "relative",
    width: `${RICH_POST_COVER_WIDTH}px`,
    height: `${RICH_POST_COVER_HEIGHT}px`,
    overflow: "hidden",
    boxSizing: "border-box",
    colorScheme: "light",
    background: input.settings.backgroundColor,
  });

  if (input.settings.templateId === "burst-black") {
    root.appendChild(createBurstRays());
  }

  const title = document.createElement("div");
  title.dataset.richPostTitle = "true";
  const isBurst = input.settings.templateId === "burst-black";
  setStyles(title, {
    position: "absolute",
    left: isBurst
      ? "144px"
      : input.settings.templateId === "warm-quote"
        ? "176px"
        : "132px",
    top: isBurst
      ? "50%"
      : input.settings.templateId === "warm-quote"
        ? "288px"
        : "310px",
    width: isBurst
      ? "792px"
      : input.settings.templateId === "warm-quote"
        ? "728px"
        : "816px",
    height: isBurst
      ? "auto"
      : input.settings.templateId === "warm-quote"
        ? "864px"
        : "820px",
    maxHeight: isBurst ? "756px" : "none",
    paddingBlock: isBurst ? "0.12em" : "0",
    boxSizing: "border-box",
    transform: isBurst ? "translateY(-50%)" : "none",
    textWrap: isBurst ? "balance" : "wrap",
    overflow: "hidden",
    color: preset.textColor,
    fontFamily: preset.fontFamily,
    fontWeight: preset.fontWeight,
    fontSize: `${preset.maxFontSize}px`,
    lineHeight: isBurst
      ? "1.38"
      : input.settings.templateId === "warm-quote"
        ? "1.34"
        : "1.48",
    letterSpacing: isBurst
      ? "8px"
      : input.settings.templateId === "warm-quote"
        ? "-2px"
        : "1px",
    whiteSpace: isBurst ? "pre-wrap" : "normal",
    overflowWrap: "break-word",
    wordBreak: "break-all",
  });

  appendHighlightedTitle(
    title,
    input.title,
    normalizeHighlightTerms(input.title, input.highlightTerms),
    input.settings.templateId,
    input.settings.accentColor,
  );
  root.appendChild(title);

  if (input.settings.templateId === "warm-quote") {
    root.appendChild(
      createQuote("“", "116px", "222px", input.settings.accentColor),
    );
    const closeQuote = createQuote(
      "”",
      "880px",
      "1070px",
      input.settings.accentColor,
    );
    closeQuote.dataset.richPostQuote = "close";
    root.appendChild(closeQuote);
  }

  return root;
}

export function fitRichPostCoverTitle(root: HTMLElement): number | null {
  const title = root.querySelector<HTMLElement>("[data-rich-post-title]");
  const templateId = root.dataset.richPostCover as
    | RichPostCoverTemplateId
    | undefined;
  if (!title || !templateId) return null;
  const preset = RICH_POST_COVER_PRESETS[templateId];
  const titleLength = Array.from(title.textContent ?? "").length;
  const maxFontSize =
    templateId === "burst-black"
      ? titleLength <= 8
        ? 188
        : titleLength <= 16
          ? 156
          : 132
      : preset.maxFontSize;

  for (
    let fontSize = maxFontSize;
    fontSize >= preset.minFontSize;
    fontSize -= 4
  ) {
    title.style.fontSize = `${fontSize}px`;
    if (
      // Browser rounding can add one pixel to an auto-height text block.
      title.scrollHeight <= title.clientHeight + 1 &&
      title.scrollWidth <= title.clientWidth
    ) {
      return fontSize;
    }
  }
  return null;
}

// 闭引号必须跟在最后一个字的右下：写死坐标只在标题排满整块时成立。
export function positionRichPostCoverClosingQuote(root: HTMLElement): void {
  const quote = root.querySelector<HTMLElement>(
    '[data-rich-post-quote="close"]',
  );
  const title = root.querySelector<HTMLElement>("[data-rich-post-title]");
  if (!quote || !title) return;

  const fontSize = Number.parseFloat(title.style.fontSize);
  if (!Number.isFinite(fontSize) || fontSize <= 0) return;

  const character = lastCharacterRect(title);
  if (!character) return;

  const canvas = root.getBoundingClientRect();
  const scale = canvas.width > 0 ? canvas.width / RICH_POST_COVER_WIDTH : 1;
  if (scale <= 0) return;

  const left =
    (character.right - canvas.left) / scale + fontSize * CLOSE_QUOTE_GAP_EM;
  const top =
    (character.bottom - canvas.top) / scale + fontSize * CLOSE_QUOTE_DROP_EM;
  quote.style.left = `${left}px`;
  quote.style.top = `${top}px`;
}

export async function ensureRichPostCoverFonts(): Promise<void> {
  if (!document.fonts) throw new Error("当前环境不支持加载封面字体");
  const loadedFonts = await Promise.all([
    document.fonts.load('700 116px "Noto Sans SC"'),
    document.fonts.load('400 104px "LXGW WenKai Lite"'),
    document.fonts.load('900 120px "Noto Sans SC"'),
  ]);
  if (loadedFonts.some((fonts) => fonts.length === 0)) {
    throw new Error("封面字体加载失败，请重试");
  }
  await document.fonts.ready;
}

export async function captureRichPostCover(
  input: RichPostCoverInput,
): Promise<Blob> {
  if (!input.title.trim()) throw new Error("封面标题不能为空");
  await ensureRichPostCoverFonts();

  const host = document.createElement("div");
  setStyles(host, {
    position: "fixed",
    left: "-12000px",
    top: "0",
    pointerEvents: "none",
  });
  const cover = createRichPostCoverElement(input);
  host.appendChild(cover);
  document.body.appendChild(host);

  try {
    if (fitRichPostCoverTitle(cover) === null) {
      throw new RichPostCoverOverflowError();
    }
    positionRichPostCoverClosingQuote(cover);
    return await domToBlob(cover, {
      width: RICH_POST_COVER_WIDTH,
      height: RICH_POST_COVER_HEIGHT,
      scale: 1,
      type: "image/png",
      backgroundColor: input.settings.backgroundColor,
    });
  } finally {
    host.remove();
  }
}

function appendHighlightedTitle(
  element: HTMLElement,
  title: string,
  terms: string[],
  templateId: RichPostCoverTemplateId,
  accentColor: string,
): void {
  let cursor = 0;
  while (cursor < title.length) {
    const matches = terms
      .map((term) => ({ term, index: title.indexOf(term, cursor) }))
      .filter((match) => match.index >= cursor)
      .sort((a, b) => a.index - b.index || b.term.length - a.term.length);
    const match = matches[0];
    if (!match) {
      element.append(title.slice(cursor));
      break;
    }
    if (match.index > cursor) element.append(title.slice(cursor, match.index));
    const highlight = document.createElement("span");
    highlight.textContent = match.term;
    if (templateId === "warm-quote" || templateId === "burst-black") {
      highlight.style.color = accentColor;
    } else {
      highlight.style.backgroundImage = `linear-gradient(${accentColor}, ${accentColor})`;
      highlight.style.backgroundPosition = "0 92%";
      highlight.style.backgroundRepeat = "no-repeat";
      highlight.style.backgroundSize = "100% 14px";
    }
    element.appendChild(highlight);
    cursor = match.index + match.term.length;
  }
}

function createBurstRays(): SVGSVGElement {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 1080 1440");
  svg.setAttribute("width", "1080");
  svg.setAttribute("height", "1440");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  svg.style.inset = "0";

  // Fixed variation keeps the preview and exported image identical.
  for (let index = 0; index < 144; index += 1) {
    const variation = ((index * 73) % 101) / 101;
    const angle = ((index + variation * 0.7) * Math.PI * 2) / 144;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    const edge = Math.min(540 / Math.abs(x), 720 / Math.abs(y));
    const inner = edge * (0.7 + variation * 0.23);
    const outer = edge + 12;
    const halfWidth = 1.5 + variation * 3;
    const ray = document.createElementNS(namespace, "polygon");
    ray.setAttribute(
      "points",
      [
        `${540 + x * inner},${720 + y * inner}`,
        `${540 + x * outer - y * halfWidth},${720 + y * outer + x * halfWidth}`,
        `${540 + x * outer + y * halfWidth},${720 + y * outer - x * halfWidth}`,
      ].join(" "),
    );
    ray.setAttribute("fill", "#ffffff");
    ray.setAttribute("fill-opacity", String(0.38 + variation * 0.48));
    svg.appendChild(ray);
  }

  return svg;
}

function createQuote(
  text: string,
  left: string,
  top: string,
  color: string,
): HTMLElement {
  const quote = document.createElement("span");
  quote.textContent = text;
  quote.setAttribute("aria-hidden", "true");
  setStyles(quote, {
    position: "absolute",
    left,
    top,
    color,
    fontFamily: '"Noto Sans SC", sans-serif',
    fontSize: "116px",
    fontWeight: "700",
    lineHeight: "1",
  });
  return quote;
}

// 无布局环境（如 jsdom）测得零矩形时返回 null，调用方保留兜底坐标。
function lastCharacterRect(element: HTMLElement): DOMRect | null {
  const text = lastTextNode(element);
  if (!text || text.data.length === 0) return null;
  if (typeof document.createRange !== "function") return null;

  const range = document.createRange();
  range.setStart(text, text.data.length - 1);
  range.setEnd(text, text.data.length);
  if (typeof range.getBoundingClientRect !== "function") return null;

  const rect = range.getBoundingClientRect();
  return rect.width === 0 && rect.height === 0 ? null : rect;
}

function lastTextNode(element: HTMLElement): Text | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  let node = walker.nextNode();
  while (node) {
    if (node.nodeValue?.trim()) last = node as Text;
    node = walker.nextNode();
  }
  return last;
}

function setStyles(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>,
): void {
  Object.assign(element.style, styles);
}
