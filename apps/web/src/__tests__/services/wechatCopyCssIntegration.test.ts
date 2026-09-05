import { describe, expect, it } from "vitest";
import {
  basicTheme,
  createMarkdownParser,
  processHtml,
  sunsetFilmTheme,
} from "@wemd/core";
import {
  applyLightRootVars,
  resolveInlineStyleVariablesForCopy,
} from "../../services/inlineStyleVarResolver";
import { normalizeCopyContainer } from "../../services/wechatCopyService";
import { serializeWechatCopyHtml } from "../../services/wechatCopyNormalizer";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";

describe("wechat copy css integration", () => {
  it.each(["transparent", "#f5f3ef"])(
    "starts with article content without blank boundary paragraphs (%s)",
    (pageBackgroundColor) => {
      const container = document.createElement("div");
      container.innerHTML = resolveInlineStyleVariablesForCopy(
        processHtml(
          createMarkdownParser().render(
            "这期继续分享几个开源项目。\n\n往期推荐👉",
          ),
          generateCSS({ ...defaultVariables, pageBackgroundColor }),
          true,
          true,
        ),
      );
      normalizeCopyContainer(container);
      const beforeCopy = container.innerHTML;
      const snapshot = document.createElement("div");
      snapshot.innerHTML = serializeWechatCopyHtml(container);

      expect(
        Array.from(snapshot.querySelectorAll("p"), (node) => node.textContent),
      ).toEqual(["这期继续分享几个开源项目。", "往期推荐👉"]);
      expect(snapshot.firstElementChild?.textContent).toContain(
        "这期继续分享几个开源项目。",
      );
      expect(snapshot.lastElementChild?.textContent).toContain("往期推荐👉");
      expect(snapshot.querySelector("p")?.style.marginTop).toBe("0px");
      expect(snapshot.querySelectorAll("p")[1].style.marginTop).toBe("16px");
      if (pageBackgroundColor !== "transparent") {
        expect(snapshot.children).toHaveLength(1);
        expect(
          (snapshot.firstElementChild as HTMLElement).style.backgroundColor,
        ).toBe("rgb(245, 243, 239)");
      }
      expect(container.innerHTML).toBe(beforeCopy);
    },
  );

  it.each([
    ["designer", generateCSS(defaultVariables)],
    ["basic", basicTheme],
    ["sunset", sunsetFilmTheme],
    [
      "sunset with background",
      `${sunsetFilmTheme}\n#wemd { background-color: #f5f3ef; }`,
    ],
  ])(
    "copies cards and images without neutral wrappers or image gaps (%s)",
    (_name, css) => {
      const html = createMarkdownParser().render(
        [
          "上方正文。",
          '<MpProfile mpId="test" nickname="测试" />',
          "![图片说明](https://example.com/image.png)",
          '<AuthorBlock name="作者" avatar="https://example.com/avatar.png" bio="作者简介" />',
          "下方正文。",
        ].join("\n\n"),
      );
      const container = document.createElement("div");
      container.innerHTML = resolveInlineStyleVariablesForCopy(
        processHtml(html, css, true, true),
      );
      normalizeCopyContainer(container);
      const beforeCopy = container.innerHTML;
      const snapshot = document.createElement("div");
      snapshot.innerHTML = serializeWechatCopyHtml(container);

      expect(snapshot.querySelector("div")).toBeNull();
      expect(snapshot.querySelectorAll("img")).toHaveLength(2);
      for (const node of snapshot.querySelectorAll<HTMLElement>(
        "img, figure",
      )) {
        expect(node.style.marginTop).toBe("0px");
        expect(node.style.marginBottom).toBe("0px");
      }
      expect(
        snapshot.querySelector<HTMLImageElement>('img[alt="作者"]')?.style
          .width,
      ).toBe("56px");
      expect(snapshot.querySelector("figcaption")?.textContent).toBe(
        "图片说明",
      );
      expect(
        snapshot.querySelector("mp-common-profile")?.getAttribute("data-id"),
      ).toBe("test");
      const originalParagraph = Array.from(
        container.querySelectorAll("p"),
      ).find((p) => p.textContent === "上方正文。");
      const copiedParagraph = Array.from(snapshot.querySelectorAll("p")).find(
        (p) => p.textContent === "上方正文。",
      );
      expect(copiedParagraph?.style.marginTop).toBe("0px");
      expect(copiedParagraph?.style.marginBottom).toBe(
        originalParagraph?.style.marginBottom,
      );
      const originalLastParagraph = Array.from(
        container.querySelectorAll("p"),
      ).find((p) => p.textContent === "下方正文。");
      const copiedLastParagraph = Array.from(
        snapshot.querySelectorAll("p"),
      ).find((p) => p.textContent === "下方正文。");
      expect(copiedLastParagraph?.style.marginTop).toBe(
        originalLastParagraph?.style.marginTop,
      );
      expect(copiedLastParagraph?.style.marginBottom).toBe(
        originalLastParagraph?.style.marginBottom,
      );
      expect(snapshot.querySelector("[data-wemd-copy-wrapper]")).toBeNull();
      expect(container.innerHTML).toBe(beforeCopy);
      if (css.includes("padding: 5px 22px")) {
        const paddingLayer = Array.from(
          snapshot.querySelectorAll<HTMLElement>("section"),
        ).find((node) => node.style.paddingTop === "5px");
        expect(paddingLayer?.style.paddingBottom).toBe("5px");
        expect(snapshot.querySelector("figure")?.style.paddingLeft).toBe(
          "22px",
        );
      }
    },
  );

  it("resolves inline var() values with scope-aware computed values", () => {
    const html = "<p>段落</p>";
    const css = `
      #wemd {
        --wemd-font-size: 14px;
        --wemd-text-color: #123456;
        --wemd-paragraph-margin: 18px;
      }
      #wemd p {
        font-size: var(--wemd-font-size);
        color: var(--wemd-text-color);
        margin: var(--wemd-paragraph-margin) 0;
      }
    `;

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );

    const container = document.createElement("div");
    container.innerHTML = output;
    const paragraph = container.querySelector("p");

    expect(paragraph).toBeTruthy();
    expect(paragraph!.style.fontSize).toBe("14px");
    expect(paragraph!.style.color).toBe("rgb(18, 52, 86)");
    expect(paragraph!.style.marginTop).toBe("18px");
    expect(paragraph!.style.marginBottom).toBe("18px");
    expect(output).toContain("margin-top: 18px;");
    expect(output).toContain("margin-bottom: 18px;");
    expect(output).not.toContain("var(--wemd-font-size)");
    expect(output).not.toContain("var(--wemd-text-color)");
    expect(output).not.toContain("var(--wemd-paragraph-margin)");
  });

  it("keeps literal var() text inside quoted string values", () => {
    const html = "<p>段落</p>";
    const css = `
      #wemd p {
        font-family: "var(--fake-family)";
        color: var(--wemd-text-color, #222222);
      }
    `;

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = output;
    const paragraph = container.querySelector("p");

    expect(paragraph).toBeTruthy();
    expect(paragraph!.style.fontFamily).toContain("var(--fake-family)");
    expect(paragraph!.style.color).toBe("rgb(34, 34, 34)");
  });

  it("resolves same custom property name based on local scope", () => {
    const html = `<p>root</p><blockquote><p>quote</p></blockquote>`;
    const css = `
      #wemd {
        --text-color: #111111;
      }
      #wemd p {
        color: var(--text-color);
      }
      #wemd blockquote {
        --text-color: #222222;
      }
    `;

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = output;
    const paragraphs = container.querySelectorAll("p");

    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].style.color).toBe("rgb(17, 17, 17)");
    expect(paragraphs[1].style.color).toBe("rgb(34, 34, 34)");
    expect(output).not.toContain("var(--text-color)");
  });

  it("falls back when circular custom properties cannot be resolved", () => {
    const html = "<p>段落</p>";
    const css = `
      #wemd {
        --a: var(--b);
        --b: var(--a);
      }
      #wemd p {
        color: var(--a, #334455);
        background-color: var(--missing-bg, #fafafa);
      }
    `;

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = output;
    const paragraph = container.querySelector("p");

    expect(paragraph).toBeTruthy();
    expect(paragraph!.style.color).toBe("rgb(51, 68, 85)");
    expect(paragraph!.style.backgroundColor).toBe("rgb(250, 250, 250)");
    expect(output).not.toContain("var(--a");
    expect(output).not.toContain("var(--b");
    expect(output).not.toMatch(/--(?:a|b)\s*:/);
  });

  it("does not read runtime global css variables outside copy content", () => {
    document.documentElement.style.setProperty(
      "--external-text-color",
      "#d4d4d4",
    );
    try {
      const html = "<p>段落</p>";
      const css = `
        #wemd p {
          color: var(--external-text-color, #111111);
        }
      `;

      const output = resolveInlineStyleVariablesForCopy(
        processHtml(html, css, true, true),
      );
      const container = document.createElement("div");
      container.innerHTML = output;
      const paragraph = container.querySelector("p");

      expect(paragraph).toBeTruthy();
      expect(paragraph!.style.color).toBe("rgb(17, 17, 17)");
      expect(paragraph!.style.color).not.toBe("rgb(212, 212, 212)");
    } finally {
      document.documentElement.style.removeProperty("--external-text-color");
    }
  });

  it("injects light ui token baseline into copy host", () => {
    const host = document.createElement("div");
    applyLightRootVars(host);

    expect(host.style.getPropertyValue("--text-primary").trim()).toBe(
      "#0f172a",
    );
    expect(host.style.getPropertyValue("--border-light").trim()).toBe(
      "#e2e8f0",
    );
    expect(host.style.getPropertyValue("--bg-primary").trim()).toBe("#ffffff");
  });

  it("materializes visual theme styles without remaining css variables", () => {
    const html = `
      <h2><span class="content">标题</span></h2>
      <p>正文段落</p>
      <blockquote><p>引用内容</p></blockquote>
      <ul><li>列表项</li></ul>
    `;
    const css = generateCSS(defaultVariables);

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = output;
    const paragraph = container.querySelector("p");
    const heading = container.querySelector("h2 .content");

    expect(paragraph).toBeTruthy();
    expect(heading).toBeTruthy();
    expect(paragraph!.style.fontSize).toBeTruthy();
    expect(paragraph!.style.lineHeight).toBeTruthy();
    expect(heading!.getAttribute("style")).toContain("font-size");
    expect(output).not.toContain("var(--wemd-");
    expect(output).not.toMatch(/--wemd-[\w-]+\s*:/);
  });

  it("keeps the wrapped heading underline clear in copied HTML", () => {
    const css = generateCSS({
      ...defaultVariables,
      h2: {
        ...defaultVariables.h2,
        preset: "bottom-border",
      },
    });
    const output = resolveInlineStyleVariablesForCopy(
      processHtml(
        '<h2><span class="content">会换成两行的长标题</span></h2>',
        css,
        true,
        true,
      ),
    );
    const container = document.createElement("div");
    container.innerHTML = output;
    const heading = container.querySelector<HTMLElement>("h2 .content");

    expect(heading).not.toBeNull();
    if (!heading) return;

    expect(heading.style.textDecorationLine).toBe("underline");
    expect(heading.style.textDecorationThickness).toBe("2px");
    expect(heading.style.textUnderlineOffset).toBe("3px");
    expect(heading.style.paddingBottom).toBe("");
    expect(heading.style.borderBottomWidth).toBe("");
  });

  it("keeps corner bracket decorations after empty-node cleanup", () => {
    const html = '<h2><span class="content">标题</span></h2>';
    const css = generateCSS({
      ...defaultVariables,
      h2: {
        ...defaultVariables.h2,
        preset: "corner-brackets",
      },
    });
    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = output;
    normalizeCopyContainer(container);

    const headingContent = container.querySelector<HTMLElement>("h2 .content");
    expect(headingContent).not.toBeNull();
    if (!headingContent) return;

    headingContent.querySelectorAll("span:empty").forEach((node) => {
      node.remove();
    });
    const decorations =
      headingContent.querySelectorAll<HTMLElement>(":scope > span");

    expect(decorations).toHaveLength(2);
    expect(Array.from(decorations, (node) => node.textContent)).toEqual([
      "\u00a0",
      "\u00a0",
    ]);
    const bottomLeft = Array.from(decorations).find(
      (node) => node.style.borderLeftWidth === "3px",
    );
    const topRight = Array.from(decorations).find(
      (node) => node.style.borderTopWidth === "3px",
    );
    const colorProbe = document.createElement("span");
    colorProbe.style.color = defaultVariables.primaryColor;
    const expectedColor = colorProbe.style.color;

    expect(bottomLeft?.style.borderBottomWidth).toBe("3px");
    expect(topRight?.style.borderRightWidth).toBe("3px");
    expect(bottomLeft?.style.borderLeftStyle).toBe("solid");
    expect(topRight?.style.borderTopStyle).toBe("solid");
    expect(bottomLeft?.style.borderLeftColor).toBe(expectedColor);
    expect(topRight?.style.borderTopColor).toBe(expectedColor);
    expect(
      Array.from(decorations, (node) => node.style.cssText).join(" "),
    ).not.toContain("var(");
  });

  it("relocates horizontal page padding in full pipeline", () => {
    const html = "<p>段落</p><h2><span class='content'>标题</span></h2>";
    const css = generateCSS({
      ...defaultVariables,
      pagePadding: 48,
    });

    const resolved = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = resolved;

    normalizeCopyContainer(container);

    const paragraph = container.querySelector("p") as HTMLElement | null;
    const heading = container.querySelector("h2") as HTMLElement | null;
    expect(paragraph).toBeTruthy();
    expect(heading).toBeTruthy();
    expect(paragraph!.style.paddingLeft).toBe("48px");
    expect(paragraph!.style.paddingRight).toBe("48px");
    expect(heading!.style.marginLeft).toBe("48px");
    expect(heading!.style.marginRight).toBe("48px");
    expect(heading!.style.paddingLeft).not.toBe("48px");
    expect(heading!.style.paddingRight).not.toBe("48px");
  });

  it("relocates horizontal page padding to hr in full pipeline", () => {
    const html = "<p>段落</p><hr />";
    const css = generateCSS({
      ...defaultVariables,
      pagePadding: 48,
    });

    const resolved = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = resolved;

    normalizeCopyContainer(container);

    const hr = container.querySelector("hr") as HTMLElement | null;
    expect(hr).toBeTruthy();
    expect(hr!.style.marginLeft).toBe("48px");
    expect(hr!.style.marginRight).toBe("48px");
    expect(hr!.style.paddingLeft).not.toBe("48px");
    expect(hr!.style.paddingRight).not.toBe("48px");
  });

  it("materializes the gradient divider color, height, and margin", () => {
    const resolved = resolveInlineStyleVariablesForCopy(
      processHtml(
        "<hr />",
        generateCSS({
          ...defaultVariables,
          hrStyle: "gradient",
          hrColor: "#f2b233",
          hrHeight: 2,
          hrMargin: 25,
        }),
        true,
        true,
      ),
    );
    const container = document.createElement("div");
    container.innerHTML = resolved;

    const hr = container.querySelector("hr") as HTMLElement | null;
    expect(hr?.style.height).toBe("2px");
    expect(hr?.style.marginTop).toBe("25px");
    expect(hr?.style.marginBottom).toBe("25px");
    expect(hr?.style.backgroundImage).toContain("linear-gradient");
    expect(hr?.style.backgroundImage).toContain("rgb(242, 178, 51)");
    expect(hr?.style.borderTopWidth).toBe("0px");
  });

  it("propagates #wemd background-color to child blocks after normalization (#52)", () => {
    const html = "<p>段落</p><blockquote><p>引用</p></blockquote>";
    const css = `
      #wemd {
        background-color: #f5f3ef;
      }
      #wemd p {
        color: #333;
      }
    `;

    const resolved = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = resolved;

    // juice 正确内联到根元素
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.backgroundColor).toBe("rgb(245, 243, 239)");

    // normalizeCopyContainer 将背景色下沉到子块
    normalizeCopyContainer(container);

    const paragraph = container.querySelector("p") as HTMLElement;
    expect(paragraph.style.backgroundColor).toBe("rgb(245, 243, 239)");

    // 根元素背景已清除（微信会清洗最外层样式）
    const newRoot = container.firstElementChild as HTMLElement;
    expect(newRoot.style.backgroundColor).toBeFalsy();
  });

  it("keeps article background continuous across paragraph margins", () => {
    const html =
      '<p style="margin: 16px 0;">第一段</p><p style="margin: 16px 0;">第二段</p>';
    const css = "#wemd { background-color: #fffbf3; }";
    const resolved = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = resolved;

    normalizeCopyContainer(container);

    const root = container.firstElementChild as HTMLElement;
    const backgroundLayer = root.firstElementChild as HTMLElement;
    expect(root.style.backgroundColor).toBeFalsy();
    expect(backgroundLayer.style.backgroundColor).toBe("rgb(255, 251, 243)");
    expect(backgroundLayer.querySelectorAll("p")).toHaveLength(2);
  });

  it("materializes inherited text color to avoid ui theme leakage", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <section id="wemd" style="color: var(--text-primary);">
        <div class="callout">
          <p class="callout-title">需要注意的问题</p>
        </div>
      </section>
    `;

    normalizeCopyContainer(container);

    const calloutTitle = container.querySelector(
      ".callout-title",
    ) as HTMLElement;
    expect(calloutTitle).toBeTruthy();
    expect(calloutTitle.style.color).toBe("rgb(26, 26, 26)");
  });

  it("keeps NBSP-backed mac dots outside code in copy pipeline", () => {
    const parser = createMarkdownParser({ showMacBar: true });
    const html = parser.render(
      "```ts\n  const a = 1;\n    console.log(a);\n```",
    );
    const css = `
      #wemd pre.custom > .mac-sign {
        display: block;
      }
    `;

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );

    const container = document.createElement("div");
    container.innerHTML = output;
    normalizeCopyContainer(container);

    const pre = container.querySelector("pre") as HTMLElement | null;
    const code = container.querySelector("pre > code");
    const dots = container.querySelectorAll("pre > .mac-sign > .mac-dot");

    expect(pre).toBeTruthy();
    expect(code).toBeTruthy();
    expect(dots).toHaveLength(3);
    expect(Array.from(dots, (dot) => (dot as HTMLElement).style.width)).toEqual(
      ["10px", "10px", "10px"],
    );
    expect(
      Array.from(dots, (dot) => (dot as HTMLElement).style.backgroundColor),
    ).toEqual(["rgb(237, 108, 96)", "rgb(247, 193, 81)", "rgb(100, 200, 86)"]);
    expect(Array.from(dots, (dot) => dot.textContent)).toEqual([
      "\u00a0",
      "\u00a0",
      "\u00a0",
    ]);
    expect(code?.querySelector(".mac-dot")).toBeNull();
    const preWithoutBar = pre?.cloneNode(true) as HTMLElement | undefined;
    preWithoutBar?.querySelector(".mac-sign")?.remove();
    expect(preWithoutBar?.textContent).toBe(code?.textContent);
    expect(output).not.toContain("<svg");
    expect(output).not.toContain("<img");

    const preChildren = Array.from(pre?.children ?? []).map(
      (element) => element.tagName,
    );
    expect(preChildren[0]).toBe("SPAN");
    expect(preChildren[1]).toBe("CODE");
  });

  it("does not add extra top padding to code when mac bar is enabled", () => {
    const html =
      "<pre class='custom'><code class='hljs language-ts'>const a = 1;</code></pre>";
    const css = generateCSS({
      ...defaultVariables,
      showMacBar: true,
    });

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );

    const container = document.createElement("div");
    container.innerHTML = output;
    normalizeCopyContainer(container);

    const code = container.querySelector("pre > code") as HTMLElement | null;
    expect(code).toBeTruthy();
    expect(code!.style.paddingTop).toBe("16px");
    expect(code!.style.paddingRight).toBe("16px");
    expect(code!.style.paddingBottom).toBe("16px");
    expect(code!.style.paddingLeft).toBe("16px");
  });

  it("uses pre background instead of code background for mac bar layout", () => {
    const html =
      "<pre class='custom'><code class='hljs language-ts'>const a = 1;</code></pre>";
    const css = generateCSS({
      ...defaultVariables,
      showMacBar: true,
      codeBackground: "#f5f5f5",
    });

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );

    const container = document.createElement("div");
    container.innerHTML = output;
    normalizeCopyContainer(container);

    const pre = container.querySelector("pre.custom") as HTMLElement | null;
    const code = container.querySelector("pre > code") as HTMLElement | null;
    expect(pre).toBeTruthy();
    expect(code).toBeTruthy();
    expect(pre!.style.background).toBe("rgb(245, 245, 245)");
    expect(pre!.style.borderRadius).toBe("8px");
    expect(code!.style.background).toBe("transparent");
    expect(code!.style.borderRadius).toBe("0");
  });

  it("preserves scroll image layout through the complete copy pipeline", () => {
    const parser = createMarkdownParser();
    const html = parser.render(
      "::: scroll-image 320\n![测试长图](https://example.com/long.png)\n:::",
    );
    const css = generateCSS({
      ...defaultVariables,
      pagePadding: 32,
    });
    const resolved = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = resolved;

    normalizeCopyContainer(container);

    const component = container.querySelector<HTMLElement>(".scroll-image");
    const viewport = container.querySelector<HTMLElement>(
      ".scroll-image-viewport",
    );
    const image =
      container.querySelector<HTMLImageElement>(".scroll-image-img");
    const hint = container.querySelector<HTMLElement>(".scroll-image-caption");

    expect(component).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(image).not.toBeNull();
    expect(hint).not.toBeNull();
    expect(viewport?.style.height).toBe("320px");
    expect(viewport?.style.overflowY).toBe("auto");
    expect(viewport?.style.overflowX).toBe("hidden");
    expect(viewport?.getAttribute("tabindex")).toBe("0");
    expect(viewport?.getAttribute("role")).toBe("region");
    expect(viewport?.getAttribute("aria-label")).toBe("可上下滚动查看完整图片");
    expect(image?.style.width).toBe("100%");
    expect(image?.style.maxWidth).toBe("100%");
    expect(image?.style.height).toBe("auto");
    expect(image?.style.margin).toBe("0px");
    expect(hint?.textContent).toBe("↕ 上下滑动查看完整图片");
  });

  it("preserves all added built-in components through the WeChat copy pipeline", () => {
    const parser = createMarkdownParser();
    const html = parser.render(
      [
        '<QRCodeBlock url="https://example.com" text="扫码" size="120" />',
        '<AuthorBlock name="Doocs" avatar="https://example.com/a.png" bio="开源组织" />',
        `<BadgeGroup tags='["Vue 3","TypeScript"]' color="#07c160" />`,
      ].join("\n\n"),
    );
    const css = generateCSS(defaultVariables);
    const resolved = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = resolved;

    normalizeCopyContainer(container);
    const serialized = serializeWechatCopyHtml(container);

    expect(serialized).toContain("api.qrserver.com");
    expect(serialized).toContain('alt="Doocs"');
    expect(serialized).toContain(">Vue 3</span>");
    expect(serialized).toContain(">TypeScript</span>");
    expect(serialized).not.toContain("<QRCodeBlock");
    expect(serialized).not.toContain("<AuthorBlock");
    expect(serialized).not.toContain("<BadgeGroup");
  });

  it("keeps article background continuous without gaps around every built-in component", () => {
    const parser = createMarkdownParser();
    const html = parser.render(
      [
        '<MpProfile mpId="MzIxNjA5ODQ0OQ==" nickname="Doocs" />',
        '<QRCodeBlock url="https://example.com" text="扫码" size="120" />',
        '<AuthorBlock name="Doocs" avatar="https://example.com/a.png" bio="开源组织" />',
        `<BadgeGroup tags='["Vue 3","TypeScript"]' color="#07c160" />`,
      ].join("\n\n"),
    );
    const resolved = resolveInlineStyleVariablesForCopy(
      processHtml(
        html,
        generateCSS({
          ...defaultVariables,
          pageBackgroundColor: "#f5f3ef",
        }),
        true,
        true,
      ),
    );
    const container = document.createElement("div");
    container.innerHTML = resolved;

    normalizeCopyContainer(container);

    const snapshot = document.createElement("div");
    snapshot.innerHTML = serializeWechatCopyHtml(container);
    const backgroundLayer = snapshot.firstElementChild as HTMLElement | null;
    const profileBlock = backgroundLayer?.querySelector<HTMLElement>(
      ".mp_profile_iframe_wrp",
    );
    const qrBlock =
      backgroundLayer?.querySelector<HTMLImageElement>(
        'img[alt="QR Code"]',
      )?.parentElement;
    const authorBlock =
      backgroundLayer?.querySelector<HTMLImageElement>('img[alt="Doocs"]')
        ?.parentElement?.parentElement;
    const badgeBlock = Array.from(
      backgroundLayer?.querySelectorAll("span") ?? [],
    ).find((span) => span.textContent === "Vue 3")?.parentElement;

    expect(snapshot.children).toHaveLength(1);
    expect(backgroundLayer?.style.backgroundColor).toBe("rgb(245, 243, 239)");
    expect(backgroundLayer?.style.marginTop || "0px").toBe("0px");
    expect(backgroundLayer?.style.marginBottom || "0px").toBe("0px");
    expect(backgroundLayer?.style.paddingTop || "0px").toBe("0px");
    expect(backgroundLayer?.style.paddingBottom || "0px").toBe("0px");

    for (const component of [profileBlock, qrBlock, authorBlock, badgeBlock]) {
      expect(component).toBeTruthy();
      expect(component?.style.marginTop || "0px").toBe("0px");
      expect(component?.style.marginBottom || "0px").toBe("0px");
      expect(component?.style.paddingTop || "0px").toBe("0px");
      expect(component?.style.paddingBottom || "0px").toBe("0px");
      expect(component?.style.backgroundColor).toBe("rgb(245, 243, 239)");
      expect(component?.hasAttribute("data-wemd-component")).toBe(false);
    }
    expect(snapshot.querySelector("[data-wemd-component]")).toBeNull();
  });
});
