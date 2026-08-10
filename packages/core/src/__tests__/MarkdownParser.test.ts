import { describe, expect, it } from "vitest";
import { createMarkdownParser } from "../MarkdownParser";

describe("MarkdownParser code block", () => {
  it("默认不输出 mac-sign 结构", () => {
    const parser = createMarkdownParser();
    const html = parser.render("```ts\nconst a = 1;\n```");

    expect(html).toContain('<pre class="custom">');
    expect(html).not.toContain('<span class="mac-sign"');
    expect(html).not.toContain('class="mac-dot');
    expect(html).not.toContain("<svg");
  });

  it("显式开启后输出带 NBSP 存活锚点的 HTML/CSS 红绿灯", () => {
    const parser = createMarkdownParser({ showMacBar: true });
    const html = parser.render("```ts\nconst a = 1;\n```");
    const dots = html.match(/class="mac-dot mac-dot-/g) ?? [];

    expect(html).toContain('<pre class="custom">');
    expect(html).toContain('<span class="mac-sign" aria-hidden="true"');
    expect(dots).toHaveLength(3);
    expect(html).toContain("background: rgb(237, 108, 96)");
    expect(html).toContain("background: rgb(247, 193, 81)");
    expect(html).toContain("background: rgb(100, 200, 86)");
    expect(html.match(/&nbsp;<\/span>/g) ?? []).toHaveLength(3);
    expect(html).toContain("font-size: 0");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("data:image");
    expect(html).toMatch(/<pre[^>]*>\s*<span[^>]*>[\s\S]*<\/span>\s*<code/i);
    expect(html).not.toMatch(/<code[^>]*>[\s\S]*mac-dot/i);
    expect(html).toContain('<span class="hljs-keyword">const</span> a = ');
  });

  it("未知语言代码块也复用同一红绿灯结构", () => {
    const parser = createMarkdownParser({ showMacBar: true });
    const html = parser.render("```not-registered\nplain text\n```");
    const dots = html.match(/class="mac-dot mac-dot-/g) ?? [];

    expect(dots).toHaveLength(3);
    expect(html).toContain("plain text");
    expect(html).not.toContain("<svg");
  });
});
