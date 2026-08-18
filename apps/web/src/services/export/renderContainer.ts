/**
 * 共享离屏渲染容器构建
 * 「复制到公众号」与「导出图片」共用同一套渲染管线：
 * Markdown 解析 → CSS 变量展开 → 内联样式 → Mermaid/表格渲染 → 归一化
 */

import { processHtml, createMarkdownParser } from "@wemd/core";
import katexCss from "katex/dist/katex.min.css?raw";
import { loadMathJax } from "../../utils/mathJaxLoader";
import { hasMathFormula } from "../../utils/katexRenderer";
import { convertLinksToFootnotes } from "../../utils/linkFootnote";
import { getLinkToFootnoteEnabled } from "../../components/Editor/ToolbarState";
import {
  applyLightRootVars,
  resolveInlineStyleVariablesForCopy,
} from "../inlineStyleVarResolver";
import {
  materializeCounterPseudoContent,
  stripCounterPseudoRules,
} from "../wechatCounterCompat";
import { expandCSSVariables } from "../cssVariableExpander";
import { normalizeCopyContainer } from "../wechatCopyNormalizer";
import { renderMermaidBlocks } from "../wechatMermaidRenderer";
import { renderTableBlocks } from "../wechatTableRenderer";
import { shouldRenderMacCodeBarNode } from "../macCodeBar";

export interface RenderContainerOptions {
  /** 容器宽度（px），复制链路 760，导出按目标页宽 */
  widthPx?: number;
  /** 是否执行微信专用 HTML 转换（链接转脚注、checkbox 转 emoji） */
  forWechat?: boolean;
  /** Mac 风格代码栏开关（透传给 Markdown 解析器） */
  showMacBar?: boolean;
}

export interface OffscreenRenderResult {
  container: HTMLElement;
  /** 移除容器，释放 DOM */
  dispose: () => void;
}

export const buildCopyCss = (themeCss: string) => {
  if (!themeCss) return katexCss;
  // 复制前展开 CSS 变量为具体值，消除微信清洗 var() 导致的样式丢失
  const expandedCss = expandCSSVariables(themeCss);
  return `${expandedCss}\n${katexCss}`;
};

/**
 * 将 HTML 中的 checkbox 转换为 emoji
 * 微信公众号会过滤 <input> 标签，需要转为 emoji 替代
 */
export const convertCheckboxesToEmoji = (html: string): string => {
  // 使用 &nbsp; 确保空格不被微信吞掉
  // 先替换选中的 checkbox（包含 checked 属性）
  let result = html.replace(/<input[^>]*checked[^>]*>/gi, "✅&nbsp;");
  // 再替换未选中的 checkbox
  result = result.replace(
    /<input[^>]*type=["']checkbox["'][^>]*>/gi,
    "⬜&nbsp;",
  );
  return result;
};

const createOffscreenContainer = (widthPx: number): HTMLElement => {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = `${widthPx}px`;
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-1";
  container.style.contain = "layout style paint";
  // 强制亮色模式，防止暗色 UI 下序列化出暗色内容
  container.style.colorScheme = "light";
  container.style.color = "#000000";
  applyLightRootVars(container);
  document.body.appendChild(container);
  return container;
};

/**
 * 将 Markdown 渲染为挂载在离屏容器中的成品 DOM
 * 调用方负责在使用完毕后调用 dispose() 移除容器
 */
export async function renderOffscreenContent(
  markdown: string,
  css: string,
  options: RenderContainerOptions = {},
): Promise<OffscreenRenderResult> {
  const { widthPx = 760, forWechat = false, showMacBar } = options;
  const container = createOffscreenContainer(widthPx);
  const dispose = () => {
    container.remove();
  };

  try {
    if (hasMathFormula(markdown)) {
      await loadMathJax();
    }
    const themedCss = buildCopyCss(css);
    const parser = createMarkdownParser({
      showMacBar: shouldRenderMacCodeBarNode(themedCss, showMacBar),
    });
    const rawHtml = parser.render(markdown);
    const sanitizedCss = stripCounterPseudoRules(themedCss);
    const sourceHtml =
      forWechat && getLinkToFootnoteEnabled()
        ? convertLinksToFootnotes(rawHtml)
        : rawHtml;
    const materializedHtml = materializeCounterPseudoContent(
      sourceHtml,
      themedCss,
    );
    const styledHtml = processHtml(materializedHtml, sanitizedCss, true, true);
    const resolvedHtml = resolveInlineStyleVariablesForCopy(styledHtml);
    const finalHtml = forWechat
      ? convertCheckboxesToEmoji(resolvedHtml)
      : resolvedHtml;

    container.innerHTML = finalHtml;
    await renderMermaidBlocks(container);
    await renderTableBlocks(container);
    normalizeCopyContainer(container);

    return { container, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}

/**
 * 读取渲染内容的背景色，作为导出图片的画布底色
 * 优先取内容根节点（#wemd）背景，透明或无效时回退白色
 */
export function getContentBackground(container: HTMLElement): string {
  const root = container.firstElementChild as HTMLElement | null;
  const probe = root ?? container;
  const background = getComputedStyle(probe).backgroundColor;
  if (
    !background ||
    background === "transparent" ||
    background === "rgba(0, 0, 0, 0)"
  ) {
    return "#ffffff";
  }
  return background;
}
