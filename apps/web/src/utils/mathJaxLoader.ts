/**
 * MathJax 按需加载工具
 * 仅在检测到数学公式时才加载 MathJax，避免不必要的内存占用
 */

const MATHJAX_ES5_BASE = `${import.meta.env.BASE_URL}libs/mathjax/es5`;

/** 离线 tex-svg 包内建扩展 + 本地 es5 扩展；禁用 autoload/require 避免异步拉取失败触发 MathJax retry */
export const MATHJAX_TEX_PACKAGES = [
  "base",
  "ams",
  "newcommand",
  "configmacros",
  "color",
  "boldsymbol",
  "cancel",
  "enclose",
] as const;

/**
 * 补上 KaTeX 认、MathJax 不认的同义命令，避免“预览正常、复制后变红字”：
 * - \bm 是 \boldsymbol 的常用简写，MathJax 的 boldsymbol 扩展只提供后者
 * - \sout 对应 enclose 扩展的水平删除线
 */
const MATHJAX_TEX_MACROS = {
  bm: ["\\boldsymbol{#1}", 1],
  sout: ["\\enclose{horizontalstrike}{#1}", 1],
} as const;

let mathJaxPromise: Promise<void> | null = null;
const MATHJAX_CONFIG_VERSION = 3;
let isLoaded = false;

/**
 * 检测内容是否包含数学公式
 */
export function hasMathFormula(content: string): boolean {
  // 检测行内公式 $...$ 或行间公式 $$...$$
  return /\$[^$]+\$/.test(content);
}

/** KaTeX 无法正确预览的 TeX 命令，需要 MathJax 离线扩展 */
export const MATHJAX_ONLY_COMMAND =
  /\\(?:color|colorbox|bbox|definecolor|textcolor|fcolorbox)\b/;

export function needsMathJaxPreview(content: string): boolean {
  return MATHJAX_ONLY_COMMAND.test(content);
}

export function isMathJaxReady(): boolean {
  if (typeof window === "undefined") return false;
  const version = window.__wemdMathJaxVersion;
  if (version !== MATHJAX_CONFIG_VERSION) return false;
  const mathJax = window.MathJax;
  return !!(mathJax?.tex2svg || mathJax?.tex2svgPromise);
}

const normalizeMathJaxSvg = (svg: SVGElement, display: boolean): void => {
  const width = svg.getAttribute("width") || svg.style.minWidth;
  svg.removeAttribute("width");
  svg.style.display = "initial";
  svg.style.setProperty("max-width", display ? "300vw" : "100%", "important");
  svg.style.flexShrink = "0";
  if (width) {
    svg.style.width = width;
  }
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
};

/** MathJax 渲染失败的输出带 mjx-merror / data-mjx-error 标记，其无填充背景块会在预览里显示成黑块 */
const MATHJAX_ERROR_SELECTOR = "mjx-merror, merror, [data-mjx-error]";

const hasMathJaxError = (container: Element): boolean =>
  container.matches(MATHJAX_ERROR_SELECTOR) ||
  container.querySelector(MATHJAX_ERROR_SELECTOR) !== null;

export async function renderLatexToSvgHtml(
  latex: string,
  display: boolean,
): Promise<string | null> {
  if (!isMathJaxReady()) return null;

  const mathJax = window.MathJax;
  if (!mathJax) return null;

  if (typeof mathJax.texReset === "function") {
    mathJax.texReset();
  }

  let container: HTMLElement;
  if (typeof mathJax.tex2svg === "function") {
    container = mathJax.tex2svg(latex, { display });
  } else if (mathJax.tex2svgPromise) {
    container = await mathJax.tex2svgPromise(latex, { display });
  } else {
    return null;
  }

  if (hasMathJaxError(container)) return null;
  const svg = container.querySelector("svg");
  if (!svg) return null;

  const clone = svg.cloneNode(true) as SVGElement;
  normalizeMathJaxSvg(clone, display);
  return clone.outerHTML;
}

/**
 * 将预览中仍由 KaTeX 占位/报错的 MathJax 专用公式替换为 SVG。
 */
export async function hydrateMathJaxEquations(
  root: HTMLElement,
): Promise<void> {
  if (!isMathJaxReady()) return;

  const wemd =
    root.querySelector<HTMLElement>("#wemd") ??
    (root.id === "wemd" ? root : null);
  if (!wemd) return;

  const nodes = wemd.querySelectorAll<HTMLElement>(
    ".inline-equation[data-latex], .block-equation[data-latex]",
  );

  for (const node of nodes) {
    const latex = node.getAttribute("data-latex") || "";
    const needsMathJax =
      node.hasAttribute("data-mathjax-pending") ||
      node.querySelector(".katex-error") !== null ||
      MATHJAX_ONLY_COMMAND.test(latex);
    if (!needsMathJax) continue;

    const display = node.classList.contains("block-equation");
    try {
      const html = await renderLatexToSvgHtml(latex, display);
      if (!html) {
        // MathJax 也渲染不出来：退回可读原文，避免留下空白公式
        node.textContent = display ? `$$${latex}$$` : `$${latex}$`;
        node.removeAttribute("data-mathjax-pending");
        continue;
      }
      node.innerHTML = html;
      node.removeAttribute("data-mathjax-pending");
    } catch (error) {
      console.error("MathJax hydrate error:", error);
    }
  }
}

/**
 * 动态加载 MathJax
 */
export function loadMathJax(): Promise<void> {
  const configuredVersion = window.__wemdMathJaxVersion;
  if (
    configuredVersion === MATHJAX_CONFIG_VERSION &&
    (window.MathJax?.tex2svg || window.MathJax?.tex2svgPromise)
  ) {
    isLoaded = true;
    return Promise.resolve();
  }

  if (configuredVersion !== MATHJAX_CONFIG_VERSION) {
    isLoaded = false;
    mathJaxPromise = null;
    document.getElementById("MathJax-script")?.remove();
    delete window.MathJax;
  }

  if (isLoaded && window.MathJax) {
    return Promise.resolve();
  }

  if (mathJaxPromise) {
    return mathJaxPromise;
  }
  mathJaxPromise = new Promise((resolve, reject) => {
    const bootstrap = {
      tex: {
        packages: [...MATHJAX_TEX_PACKAGES],
        macros: { ...MATHJAX_TEX_MACROS },
        inlineMath: [["$", "$"]],
        displayMath: [["$$", "$$"]],
        tags: "ams",
      },
      svg: {
        // 使用 none，确保复制时每个 SVG 自带字体定义，避免离开缓存后丢失公式
        fontCache: "none",
      },
      options: {
        renderActions: {
          addMenu: [0, "", ""],
        },
      },
      startup: {
        typeset: false,
        ready: () => {
          window.MathJax?.startup?.defaultReady?.();
          const startupPromise = window.MathJax?.startup?.promise;
          if (startupPromise && typeof startupPromise.then === "function") {
            startupPromise
              .then(() => {
                isLoaded = true;
                window.__wemdMathJaxVersion = MATHJAX_CONFIG_VERSION;
                resolve();
              })
              .catch((err: unknown) => {
                mathJaxPromise = null;
                reject(err instanceof Error ? err : new Error(String(err)));
              });
          } else {
            isLoaded = true;
            resolve();
          }
        },
      },
      loader: {
        paths: {
          mathjax: MATHJAX_ES5_BASE,
        },
        load: [
          "[tex]/color",
          "[tex]/boldsymbol",
          "[tex]/cancel",
          "[tex]/enclose",
        ],
        failed: (error: { message?: string }) => {
          mathJaxPromise = null;
          reject(new Error(error.message || "Failed to load MathJax"));
        },
      },
    };
    window.MathJax = bootstrap;

    // 动态加载脚本
    const script = document.createElement("script");
    script.id = "MathJax-script";
    script.src = `${import.meta.env.BASE_URL}libs/mathjax/tex-svg.js`;
    script.async = true;
    script.onerror = () => {
      mathJaxPromise = null;
      reject(new Error("Failed to load MathJax"));
    };
    document.head.appendChild(script);
  });

  return mathJaxPromise;
}

/**
 * 渲染指定元素中的数学公式
 */
export async function typesetElement(element: Element): Promise<void> {
  if (!window.MathJax) {
    return;
  }

  try {
    window.MathJax.typesetClear?.([element]);
    if (window.MathJax.typesetPromise) {
      await window.MathJax.typesetPromise([element]);
    }
  } catch (err) {
    console.error("MathJax typeset error:", err);
  }
}

// 声明 MathJax 类型
declare global {
  interface Window {
    /** 当前 MathJax 配置版本；与模块内常量不一致时视为尚未配置 */
    __wemdMathJaxVersion?: number;
    MathJax?: {
      tex2svg?: (math: string, options: { display: boolean }) => HTMLElement;
      tex2svgPromise?: (
        math: string,
        options: { display: boolean },
      ) => Promise<HTMLElement>;
      texReset?: () => void;
      startup?: {
        /** 由 MathJax 在加载完成后挂载，配置阶段可以缺省 */
        defaultReady?: () => void;
        ready?: () => void;
        promise?: Promise<void>;
      };
      typesetClear?: (elements: Element[]) => void;
      typesetPromise?: (elements: Element[]) => Promise<void>;
    };
  }
}
