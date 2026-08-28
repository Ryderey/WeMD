import { createMarkdownParser } from "@wemd/core";
import { domToBlob } from "modern-screenshot";

export const RICH_POST_COVER_WIDTH = 1080;
export const RICH_POST_COVER_HEIGHT = 1440;

export type RichPostCoverTemplateId = "warm-quote" | "cool-underline";

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

  const title = document.createElement("div");
  title.dataset.richPostTitle = "true";
  setStyles(title, {
    position: "absolute",
    left: input.settings.templateId === "warm-quote" ? "176px" : "132px",
    top: input.settings.templateId === "warm-quote" ? "288px" : "310px",
    width: input.settings.templateId === "warm-quote" ? "728px" : "816px",
    height: input.settings.templateId === "warm-quote" ? "864px" : "820px",
    overflow: "hidden",
    color: preset.textColor,
    fontFamily: preset.fontFamily,
    fontWeight: preset.fontWeight,
    fontSize: `${preset.maxFontSize}px`,
    lineHeight: input.settings.templateId === "warm-quote" ? "1.34" : "1.48",
    letterSpacing: input.settings.templateId === "warm-quote" ? "-2px" : "1px",
    whiteSpace: "normal",
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
    root.appendChild(
      createQuote("”", "880px", "1070px", input.settings.accentColor),
    );
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

  for (
    let fontSize = preset.maxFontSize;
    fontSize >= preset.minFontSize;
    fontSize -= 4
  ) {
    title.style.fontSize = `${fontSize}px`;
    if (
      title.scrollHeight <= title.clientHeight &&
      title.scrollWidth <= title.clientWidth
    ) {
      return fontSize;
    }
  }
  return null;
}

export async function ensureRichPostCoverFonts(): Promise<void> {
  if (!document.fonts) throw new Error("当前环境不支持加载封面字体");
  await Promise.all([
    document.fonts.load('700 116px "Noto Sans SC"'),
    document.fonts.load('400 104px "LXGW WenKai Lite"'),
  ]);
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
    if (templateId === "warm-quote") {
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

function setStyles(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>,
): void {
  Object.assign(element.style, styles);
}
