import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  hydrateMathJaxEquations,
  isMathJaxReady,
  needsMathJaxPreview,
} from "../../utils/mathJaxLoader";

describe("mathJaxLoader preview helpers", () => {
  beforeEach(() => {
    (
      window as Window & { __wemdMathJaxVersion?: number }
    ).__wemdMathJaxVersion = 3;
    window.MathJax = {
      texReset: vi.fn(),
      tex2svg: vi.fn(() => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML =
          '<svg width="4ex" height="2ex" viewBox="0 0 40 20"><rect data-bgcolor="#FFF200" fill="#FFF200" width="40" height="20"></rect><text x="8" y="14">x^2+y^2=r^2</text></svg>';
        return wrapper;
      }),
    };
  });

  afterEach(() => {
    delete (window as Window & { __wemdMathJaxVersion?: number })
      .__wemdMathJaxVersion;
    delete window.MathJax;
  });

  it("detects MathJax-only preview commands", () => {
    expect(needsMathJaxPreview("$\\colorbox{yellow}{x^2+y^2=r^2}$")).toBe(true);
    expect(needsMathJaxPreview("$E=mc^2$")).toBe(false);
  });

  it("reports readiness only after config version is set", () => {
    expect(isMathJaxReady()).toBe(true);
    (
      window as Window & { __wemdMathJaxVersion?: number }
    ).__wemdMathJaxVersion = 1;
    expect(isMathJaxReady()).toBe(false);
  });

  it("hydrates pending colorbox placeholders with MathJax SVG", async () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <section id="wemd">
        <p>
          <span
            class="inline-equation"
            data-latex="\\colorbox{yellow}{x^2+y^2=r^2}"
            data-mathjax-pending
          ></span>
        </p>
      </section>
    `;

    await hydrateMathJaxEquations(root);

    const equation = root.querySelector(".inline-equation");
    expect(equation?.querySelector("svg")).toBeTruthy();
    expect(equation?.innerHTML).toContain("data-bgcolor");
    expect(equation?.hasAttribute("data-mathjax-pending")).toBe(false);
    expect(window.MathJax?.tex2svg).toHaveBeenCalledWith(
      "\\colorbox{yellow}{x^2+y^2=r^2}",
      { display: false },
    );
  });

  it("refuses MathJax error output and falls back to readable source", async () => {
    window.MathJax = {
      texReset: vi.fn(),
      tex2svg: vi.fn(() => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML =
          '<svg viewBox="0 0 100 50" data-mjx-error="Undefined control sequence"><rect width="100" height="50"></rect><text>Undefined control sequence</text></svg>';
        return wrapper;
      }),
    };
    const root = document.createElement("div");
    root.innerHTML = `
      <section id="wemd">
        <p>
          <span
            class="inline-equation"
            data-latex="\\ce{H2O}"
            data-mathjax-pending
          ></span>
        </p>
      </section>
    `;

    await hydrateMathJaxEquations(root);

    const equation = root.querySelector(".inline-equation");
    expect(equation?.querySelector("rect")).toBeNull();
    expect(equation?.textContent).toBe("$\\ce{H2O}$");
    expect(equation?.hasAttribute("data-mathjax-pending")).toBe(false);
  });
});
