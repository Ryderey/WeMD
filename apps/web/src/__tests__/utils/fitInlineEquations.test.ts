import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fitInlineEquations } from "../../utils/fitInlineEquations";

describe("fitInlineEquations", () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.appendChild(root);
  });

  afterEach(() => {
    root.remove();
  });

  it("scales overflowing KaTeX inline equations to fit the container", () => {
    root.innerHTML = `
      <section id="wemd" style="width: 200px;">
        <p>
          <span class="inline-equation">
            <span class="katex" style="display: inline-block; width: 400px; height: 20px;"></span>
          </span>
        </p>
      </section>
    `;

    const wrapper = root.querySelector<HTMLElement>(".inline-equation")!;
    const katex = wrapper.querySelector<HTMLElement>(".katex")!;
    Object.defineProperty(katex, "scrollWidth", {
      value: 400,
      configurable: true,
    });
    Object.defineProperty(katex, "getBoundingClientRect", {
      value: () => ({
        width: 400,
        height: 20,
        top: 0,
        left: 0,
        right: 400,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      configurable: true,
    });

    const wemd = root.querySelector<HTMLElement>("#wemd")!;
    Object.defineProperty(wemd, "clientWidth", {
      value: 200,
      configurable: true,
    });
    Object.defineProperty(wemd, "getBoundingClientRect", {
      value: () => ({
        width: 200,
        height: 40,
        top: 0,
        left: 0,
        right: 200,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      configurable: true,
    });
    Object.defineProperty(wrapper, "getBoundingClientRect", {
      value: () => ({
        width: 400,
        height: 20,
        top: 0,
        left: 0,
        right: 400,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      configurable: true,
    });

    fitInlineEquations(root);

    expect(wrapper.classList.contains("inline-equation--fitted")).toBe(true);
    expect(katex.style.transform).toBe("scale(0.5)");
    expect(wrapper.style.width).toBe("200px");
  });

  it("does not scale inline equations that already fit", () => {
    root.innerHTML = `
      <section id="wemd" style="width: 400px;">
        <p>
          <span class="inline-equation">
            <span class="katex" style="display: inline-block; width: 120px; height: 20px;"></span>
          </span>
        </p>
      </section>
    `;

    const wrapper = root.querySelector<HTMLElement>(".inline-equation")!;
    const katex = wrapper.querySelector<HTMLElement>(".katex")!;
    Object.defineProperty(katex, "scrollWidth", {
      value: 120,
      configurable: true,
    });
    Object.defineProperty(katex, "getBoundingClientRect", {
      value: () => ({
        width: 120,
        height: 20,
        top: 0,
        left: 0,
        right: 120,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      configurable: true,
    });

    const wemd = root.querySelector<HTMLElement>("#wemd")!;
    Object.defineProperty(wemd, "clientWidth", {
      value: 400,
      configurable: true,
    });
    Object.defineProperty(wemd, "getBoundingClientRect", {
      value: () => ({
        width: 400,
        height: 40,
        top: 0,
        left: 0,
        right: 400,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      configurable: true,
    });
    Object.defineProperty(wrapper, "getBoundingClientRect", {
      value: () => ({
        width: 120,
        height: 20,
        top: 0,
        left: 0,
        right: 120,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      configurable: true,
    });

    fitInlineEquations(root);

    expect(wrapper.classList.contains("inline-equation--fitted")).toBe(false);
    expect(katex.style.transform).toBe("");
  });
});
