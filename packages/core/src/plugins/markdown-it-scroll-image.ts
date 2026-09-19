import MarkdownIt from "markdown-it";
import markdownItContainer from "markdown-it-container";
import StateCore from "markdown-it/lib/rules_core/state_core";
import Token from "markdown-it/lib/token";

const DEFAULT_HEIGHT = 320;
const MIN_HEIGHT = 160;
const MAX_HEIGHT = 800;

export const SCROLL_IMAGE_MAX_IMAGES = 20;

export type ScrollImageDirection = "vertical" | "horizontal";

interface ScrollImageItem {
  src: string;
  alt: string;
  title?: string;
}

interface ScrollImageMeta {
  valid: boolean;
  height?: number;
  direction?: ScrollImageDirection;
  images?: ScrollImageItem[];
}

const parseParams = (
  info: string,
): { height: number; direction: ScrollImageDirection } | null => {
  const parts = info.trim().split(/\s+/);
  if (parts[0] !== "scroll-image" || parts.length > 3) return null;
  if (parts.length === 1) {
    return { height: DEFAULT_HEIGHT, direction: "vertical" };
  }
  if (!/^-?\d+$/.test(parts[1])) return null;
  if (
    parts.length === 3 &&
    parts[2] !== "horizontal" &&
    parts[2] !== "vertical"
  ) {
    return null;
  }

  const height = Number(parts[1]);
  return {
    height: Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height)),
    direction:
      parts.length === 3 && parts[2] === "horizontal"
        ? "horizontal"
        : "vertical",
  };
};

const findClosingToken = (tokens: Token[], start: number): number => {
  let depth = 1;
  for (let index = start + 1; index < tokens.length; index += 1) {
    if (tokens[index].type === "container_scroll-image_open") depth += 1;
    if (tokens[index].type === "container_scroll-image_close") depth -= 1;
    if (depth === 0) return index;
  }
  return -1;
};

const collectParagraphImages = (
  state: StateCore,
  inlineToken: Token,
): Token[] | null => {
  const children =
    state.md.parseInline(inlineToken.content, state.env)[0]?.children ?? [];
  const images: Token[] = [];
  for (const child of children) {
    if (child.type === "image") {
      images.push(child);
      continue;
    }
    if (child.type === "softbreak" || child.type === "hardbreak") continue;
    if (child.type === "text" && child.content.trim() === "") continue;
    return null;
  }
  return images.length > 0 ? images : null;
};

const collectImages = (
  state: StateCore,
  openIndex: number,
  closeIndex: number,
): Token[] | null => {
  const innerTokens = state.tokens.slice(openIndex + 1, closeIndex);
  const images: Token[] = [];

  for (let index = 0; index < innerTokens.length; index += 3) {
    const open = innerTokens[index];
    const isFigure = open?.type === "figure_open";
    if (!isFigure && open?.type !== "paragraph_open") return null;
    const expectedClose = isFigure ? "figure_close" : "paragraph_close";
    if (
      innerTokens[index + 1]?.type !== "inline" ||
      innerTokens[index + 2]?.type !== expectedClose
    ) {
      return null;
    }

    const paragraphImages = collectParagraphImages(
      state,
      innerTokens[index + 1],
    );
    if (paragraphImages === null) return null;
    images.push(...paragraphImages);
  }

  if (images.length === 0 || images.length > SCROLL_IMAGE_MAX_IMAGES)
    return null;
  return images;
};

const scrollImagePlugin = (md: MarkdownIt) => {
  markdownItContainer(md, "scroll-image", {
    validate: (params: string) =>
      params.trim().split(/\s+/, 1)[0] === "scroll-image",
    render: (tokens: Token[], index: number) => {
      const token = tokens[index];
      const meta = (token.meta ?? { valid: false }) as ScrollImageMeta;

      if (!meta.valid) {
        return token.nesting === 1 ? "<div>\n" : "</div>\n";
      }
      if (token.nesting === -1) return "";

      const escape = md.utils.escapeHtml;
      const isHorizontal = meta.direction === "horizontal";
      const rootClass = isHorizontal
        ? "scroll-image scroll-image-horizontal"
        : "scroll-image";
      const viewportStyle = isHorizontal
        ? `display:block;width:100%;height:${meta.height}px;overflow-y:hidden;overflow-x:auto;box-sizing:border-box;scrollbar-gutter:auto;touch-action:auto;-webkit-overflow-scrolling:touch;`
        : `display:block;width:100%;height:${meta.height}px;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;scrollbar-gutter:stable;touch-action:pan-y;-webkit-overflow-scrolling:touch;`;
      const viewportLabel = isHorizontal
        ? "可左右滚动查看完整图片"
        : "可上下滚动查看完整图片";
      const imgStyle = isHorizontal
        ? "display:inline-block;vertical-align:top;height:100%;width:auto;max-width:none;max-height:none;margin:0;border:0;"
        : "display:block;width:100%;max-width:100%;height:auto;margin:0;border:0;";
      const caption = isHorizontal
        ? "↔ 左右滑动查看完整图片"
        : "↕ 上下滑动查看完整图片";
      const images = (meta.images ?? [])
        .map((item) => {
          const title = item.title ? ` title="${escape(item.title)}"` : "";
          return `<img class="scroll-image-img" src="${escape(item.src)}" alt="${escape(item.alt)}"${title} style="${imgStyle}" />`;
        })
        .join("");
      const viewportContent = isHorizontal
        ? `<section class="scroll-image-track" style="display:inline-block;width:max-content;height:100%;white-space:nowrap;vertical-align:top;font-size:0;line-height:0;">${images}</section>`
        : images;

      return (
        `<section class="${rootClass}" style="display:block;width:100%;box-sizing:border-box;margin:1em 0 0.5em;">` +
        `<section class="scroll-image-viewport" tabindex="0" role="region" aria-label="${viewportLabel}" style="${viewportStyle}">` +
        viewportContent +
        "</section>" +
        `<p class="scroll-image-caption" style="display:block;margin:6px 0 0;padding:0;text-align:center;color:#888;font-size:13px;line-height:1.5;">${caption}</p>` +
        "</section>\n"
      );
    },
  });

  md.core.ruler.push("scroll_image", (state: StateCore) => {
    for (let index = 0; index < state.tokens.length; index += 1) {
      const openToken = state.tokens[index];
      if (openToken.type !== "container_scroll-image_open") continue;

      const closeIndex = findClosingToken(state.tokens, index);
      if (closeIndex === -1) continue;

      const params = parseParams(openToken.info);
      const images =
        params === null ? null : collectImages(state, index, closeIndex);
      if (params === null || images === null) {
        openToken.meta = { valid: false } satisfies ScrollImageMeta;
        state.tokens[closeIndex].meta = {
          valid: false,
        } satisfies ScrollImageMeta;
        continue;
      }

      const meta: ScrollImageMeta = {
        valid: true,
        height: params.height,
        direction: params.direction,
        images: images.map((image) => ({
          src: image.attrGet("src") ?? "",
          alt: state.md.renderer.renderInlineAsText(
            image.children ?? [],
            state.md.options,
            state.env,
          ),
          title: image.attrGet("title") ?? undefined,
        })),
      };

      openToken.meta = meta;
      state.tokens[closeIndex].meta = { valid: true } satisfies ScrollImageMeta;
      state.tokens.splice(index + 1, closeIndex - index - 1);
      index += 1;
    }
  });
};

export default scrollImagePlugin;
