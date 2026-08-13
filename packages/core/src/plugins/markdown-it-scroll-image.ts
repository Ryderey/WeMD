import MarkdownIt from "markdown-it";
import markdownItContainer from "markdown-it-container";
import StateCore from "markdown-it/lib/rules_core/state_core";
import Token from "markdown-it/lib/token";

const DEFAULT_HEIGHT = 320;
const MIN_HEIGHT = 160;
const MAX_HEIGHT = 800;

interface ScrollImageMeta {
  valid: boolean;
  height?: number;
  src?: string;
  alt?: string;
  title?: string;
}

const parseHeight = (info: string): number | null => {
  const parts = info.trim().split(/\s+/);
  if (parts[0] !== "scroll-image" || parts.length > 2) return null;
  if (parts.length === 1) return DEFAULT_HEIGHT;
  if (!/^-?\d+$/.test(parts[1])) return null;

  const height = Number(parts[1]);
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height));
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

const getSingleImage = (
  state: StateCore,
  openIndex: number,
  closeIndex: number,
): Token | null => {
  const innerTokens = state.tokens.slice(openIndex + 1, closeIndex);
  if (
    innerTokens.length !== 3 ||
    innerTokens[0].type !== "figure_open" ||
    innerTokens[1].type !== "inline" ||
    innerTokens[2].type !== "figure_close"
  ) {
    return null;
  }

  const parsedInline = state.md.parseInline(innerTokens[1].content, state.env);
  const children = parsedInline[0]?.children ?? [];
  return children.length === 1 && children[0].type === "image"
    ? children[0]
    : null;
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
      const title = meta.title ? ` title="${escape(meta.title)}"` : "";

      return (
        '<section class="scroll-image" style="display:block;width:100%;box-sizing:border-box;margin:1em 0 0.5em;">' +
        `<section class="scroll-image-viewport" tabindex="0" role="region" aria-label="可上下滚动查看完整图片" style="display:block;width:100%;height:${meta.height}px;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;scrollbar-gutter:stable;touch-action:pan-y;-webkit-overflow-scrolling:touch;">` +
        `<img class="scroll-image-img" src="${escape(meta.src ?? "")}" alt="${escape(meta.alt ?? "")}"${title} style="display:block;width:100%;max-width:100%;height:auto;margin:0;border:0;" />` +
        "</section>" +
        '<p class="scroll-image-caption" style="display:block;margin:6px 0 0;padding:0;text-align:center;color:#888;font-size:13px;line-height:1.5;">↕ 上下滑动查看完整图片</p>' +
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

      const height = parseHeight(openToken.info);
      const image = getSingleImage(state, index, closeIndex);
      if (height === null || image === null) {
        openToken.meta = { valid: false } satisfies ScrollImageMeta;
        state.tokens[closeIndex].meta = {
          valid: false,
        } satisfies ScrollImageMeta;
        continue;
      }

      const meta: ScrollImageMeta = {
        valid: true,
        height,
        src: image.attrGet("src") ?? "",
        alt: state.md.renderer.renderInlineAsText(
          image.children ?? [],
          state.md.options,
          state.env,
        ),
        title: image.attrGet("title") ?? undefined,
      };

      openToken.meta = meta;
      state.tokens[closeIndex].meta = { valid: true } satisfies ScrollImageMeta;
      state.tokens.splice(index + 1, closeIndex - index - 1);
      index += 1;
    }
  });
};

export default scrollImagePlugin;
