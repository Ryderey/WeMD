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

describe("MarkdownParser scroll image", () => {
  const render = (markdown: string) => createMarkdownParser().render(markdown);

  it("使用默认高度输出可聚焦的纵向滚动容器和固定提示", () => {
    const html = render(
      "::: scroll-image\n![长图](https://example.com/long.png)\n:::",
    );

    expect(html).toContain('class="scroll-image-viewport"');
    expect(html).toContain("height:320px");
    expect(html).toContain("overflow-y:auto");
    expect(html).toContain("overflow-x:hidden");
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="可上下滚动查看完整图片"');
    expect(html).toContain("↕ 上下滑动查看完整图片");
  });

  it.each([
    ["240", 240],
    ["80", 160],
    ["999", 800],
  ])("解析并限制高度 %s", (input, expected) => {
    const html = render(
      `::: scroll-image ${input}\n![长图](https://example.com/long.png)\n:::`,
    );

    expect(html).toContain(`height:${expected}px`);
  });

  it("由 MarkdownIt 解析复杂地址、转义文本和标题", () => {
    const html = render(
      '::: scroll-image 420\n![A & B](<https://example.com/a_(1).png?x=1&y=2> "标题 & 说明")\n:::',
    );

    expect(html).toContain('src="https://example.com/a_(1).png?x=1&amp;y=2"');
    expect(html).toContain('alt="A &amp; B"');
    expect(html).toContain('title="标题 &amp; 说明"');
    expect(html).toContain(
      'style="display:block;width:100%;max-width:100%;height:auto;margin:0;border:0;"',
    );
  });

  it.each([
    "::: scroll-image tall\n![长图](https://example.com/a.png)\n:::",
    "::: scroll-image 320 extra\n![长图](https://example.com/a.png)\n:::",
    "::: scroll-image 320\n普通文本\n:::",
    "::: scroll-image 320\n![A](https://example.com/a.png) ![B](https://example.com/b.png)\n:::",
  ])("非法或非单图内容不转换", (markdown) => {
    const html = render(markdown);

    expect(html).not.toContain('class="scroll-image-viewport"');
    expect(html).not.toContain("↕ 上下滑动查看完整图片");
  });

  it("不影响现有横向图片流", () => {
    const html = render(
      "<![A](https://example.com/a.png),![B](https://example.com/b.png)>",
    );

    expect(html).toContain('class="imageflow-layer1"');
    expect(html).toContain("<<< 左右滑动见更多 >>>");
    expect(html).not.toContain('class="scroll-image-viewport"');
  });
});

describe("MarkdownParser MpProfile", () => {
  const render = (markdown: string) => createMarkdownParser().render(markdown);

  it("renders a standalone profile with reference-compatible markup", () => {
    const html = render(
      '<MpProfile mpId="MzIx" nickname="Doocs" headimg="https://example.com/logo.png" signature="GitHub &amp; 开源" serviceType="2" verifyStatus="1" />',
    );

    expect(html).toContain(
      'class="mp_profile_iframe_wrp custom_select_card_wrp"',
    );
    expect(html).toContain('data-pluginname="mpprofile"');
    expect(html).toContain('data-id="MzIx"');
    expect(html).toContain('data-nickname="Doocs"');
    expect(html).toContain('data-headimg="https://example.com/logo.png"');
    expect(html).toContain('data-signature="GitHub &amp; 开源"');
    expect(html).toContain('data-service_type="2"');
    expect(html).toContain('data-verify_status="1"');
  });

  it("defaults optional account classifications", () => {
    const html = render('<MpProfile mpId="id" nickname="name" />');

    expect(html).toContain('data-service_type="1"');
    expect(html).toContain('data-verify_status="0"');
  });

  it.each([
    '<MpProfile nickname="name" />',
    'prefix <MpProfile mpId="id" nickname="name" />',
    '<OtherProfile mpId="id" nickname="name" />',
    '```html\n<MpProfile mpId="id" nickname="name" />\n```',
    '<MpProfile mpId="id" nickname="name" unexpected="value" />',
  ])("does not render invalid component-like text", (markdown) => {
    const html = render(markdown);

    expect(html).not.toContain("mp-common-profile");
  });
});
