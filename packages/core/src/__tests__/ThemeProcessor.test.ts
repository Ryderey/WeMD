import { describe, expect, it } from "vitest";
import { processHtml } from "../ThemeProcessor";

describe("ThemeProcessor mac bar", () => {
  it("保留 pre 与 code 之间带 NBSP 存活锚点的红绿灯，并保持代码空格保护", () => {
    const html =
      '<pre class="custom"><span class="mac-sign" aria-hidden="true"><span class="mac-dot mac-dot-red" style="display:inline-block;background:rgb(237,108,96);font-size:0">&nbsp;</span><span class="mac-dot mac-dot-yellow" style="display:inline-block;background:rgb(247,193,81);font-size:0">&nbsp;</span><span class="mac-dot mac-dot-green" style="display:inline-block;background:rgb(100,200,86);font-size:0">&nbsp;</span></span><code class="hljs language-ts">  const a = 1;\n    console.log(a);</code></pre>';
    const css = `
      #wemd pre.custom > .mac-sign {
        display: block;
      }
    `;

    const output = processHtml(html, css, false, true);
    const dots = output.match(/class="mac-dot mac-dot-/g) ?? [];

    expect(dots).toHaveLength(3);
    expect(output).toMatch(/<pre[^>]*>\s*<span[^>]*>[\s\S]*<\/span><code/i);
    expect(output).not.toContain("<svg");
    expect(output).not.toContain("<img");
    expect(output.match(/&nbsp;<\/span>/g) ?? []).toHaveLength(3);
    expect(output).not.toMatch(/<code[^>]*>[\s\S]*mac-dot/i);
    expect(output).toContain("&nbsp;&nbsp;const a = 1;");
    expect(output).toContain("\n&nbsp;&nbsp;&nbsp;&nbsp;console.log(a);");
  });
});
