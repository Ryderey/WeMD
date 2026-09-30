// Run via check.ps1; renders the real selection result for browser inspection.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { render, fireEvent } from "@testing-library/react";
import { HeadingSection } from "../../components/Theme/ThemeDesigner/sections/HeadingSection";
import { createMarkdownParser, processHtml } from "@wemd/core";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";
import { buildCopyCss } from "../../services/export/renderContainer";
import { resolveInlineStyleVariablesForCopy } from "../../services/inlineStyleVarResolver";
import { normalizeCopyContainer } from "../../services/wechatCopyService";
import { serializeWechatCopyHtml } from "../../services/wechatCopyNormalizer";

describe("chapter label reference diagnostic", () => {
  it("matches the reference title's typography and two distinct colors", () => {
    const chosen = { ...defaultVariables, h2: { ...defaultVariables.h2 } };
    const panel = render(createElement(HeadingSection, {
      variables: chosen, activeHeading: "h2", setActiveHeading: () => {}, updateVariable: () => {},
      updateHeading: (level, updates) => {
        chosen[level] = { ...chosen[level], ...updates };
      },
    }));
    fireEvent.click(panel.getByRole("button", { name: "章节标签" }));
    const css = generateCSS(chosen);
    const raw = createMarkdownParser().render(
      '## <span class="chapter-label">SECTION 01</span>建立阅读层级',
    );
    const root = document.createElement("div");
    root.innerHTML = resolveInlineStyleVariablesForCopy(
      processHtml(raw, buildCopyCss(css), true, true),
    );
    normalizeCopyContainer(root);
    const copied = serializeWechatCopyHtml(root);
    root.innerHTML = copied;
    const content = root.querySelector<HTMLElement>("h2 .content");
    const label = root.querySelector<HTMLElement>(".chapter-label");
    if (!content || !label) throw new Error("Missing copied chapter heading");
    expect(copied).not.toContain("var(--wemd-");
    const actual = {
      titleColor: content.style.color,
      titleSize: content.style.fontSize,
      titleLineHeight: content.style.lineHeight,
      titleWeight: content.style.fontWeight,
      titleTracking: content.style.letterSpacing,
      labelColor: label.style.color,
      ruleColor: content.style.borderLeftColor,
    };
    console.log("@@REFERENCE_DIFF@@", JSON.stringify(actual));
    const reference = '<h2 style="font-size:20px;line-height:1.5;font-weight:750;color:#FFA900;letter-spacing:0.2px;border-left:3px solid #F96E57;padding-left:13px;margin:0 8px;"><span style="display:block;font-size:10px;line-height:1.4;font-weight:700;color:#F96E57;letter-spacing:1.6px;margin-bottom:4px;">SECTION 01</span><span style="display:block;">建立阅读层级</span></h2>';
    const evidence = resolve(process.cwd(), "../../.trellis/tasks/09-30-chapter-label-reference/research");
    const longRaw = createMarkdownParser().render(
      '## <span class="chapter-label">SECTION 02</span>建立阅读层级，让较长的章节标题在窄正文中自然换行',
    );
    writeFileSync(resolve(evidence, "copied-fragment.txt"), copied);
    writeFileSync(resolve(evidence, "copied.html"), `<!doctype html><meta charset="utf-8"><title>Final copied heading</title>${copied}`);
    writeFileSync(resolve(evidence, "verified.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>章节标题修正后实际对照</title><style>body{font-family:Microsoft YaHei,sans-serif;background:#f6f5f1;margin:24px;color:#222} main{display:grid;gap:16px} article{background:white;padding:24px} h1{font-size:20px} h3{font-size:14px;margin:0 0 24px} .stage{padding:20px 0;min-height:90px} .narrow{width:240px;max-width:100%} ${css}</style><h1>章节标签 · 修正后实际渲染</h1><main><article><h3>WeDraft 参考（原始内联样式）</h3><div class="stage" id="reference">${reference}</div></article><article><h3>WeMD 实现（真实选择入口 + parser + CSS）</h3><div class="stage" id="current">${processHtml(raw, css, false)}</div></article><article><h3>窄正文 / 长标题（240px）</h3><div class="stage narrow" id="narrow">${processHtml(longRaw, css, false)}</div></article></main>`);
    expect(actual).toEqual({
      titleColor: "rgb(255, 169, 0)", titleSize: "20px",
      titleLineHeight: "1.5", titleWeight: "750", titleTracking: "0.2px",
      labelColor: "rgb(249, 110, 87)", ruleColor: "rgb(249, 110, 87)",
    });
  });
});
