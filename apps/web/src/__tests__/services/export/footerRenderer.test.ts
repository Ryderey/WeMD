import { describe, expect, it } from "vitest";
import { createFooterElement } from "../../../services/export/footerRenderer";
import { getPageLayout } from "../../../services/export/paginator";

const layout = getPageLayout(1080, 1440);

describe("createFooterElement", () => {
  it("方案 A：无水印时页码居中且仅一个子节点", () => {
    const footer = createFooterElement({
      pageIndex: 2,
      totalPages: 5,
      watermark: "",
      layout,
    });
    expect(footer.style.justifyContent).toBe("center");
    expect(footer.children).toHaveLength(1);
    expect(footer.textContent).toBe("2 / 5");
    expect(footer.style.height).toBe("64px");
    expect(footer.style.fontSize).toBe("24px");
  });

  it("方案 B：有水印时左页码右水印", () => {
    const footer = createFooterElement({
      pageIndex: 1,
      totalPages: 3,
      watermark: "@wemd",
      layout,
    });
    expect(footer.style.justifyContent).toBe("space-between");
    expect(footer.children).toHaveLength(2);
    expect(footer.children[0].textContent).toBe("1 / 3");
    expect(footer.children[1].textContent).toBe("@wemd");
  });

  it("纯空白水印按方案 A 处理", () => {
    const footer = createFooterElement({
      pageIndex: 1,
      totalPages: 2,
      watermark: "   ",
      layout,
    });
    expect(footer.style.justifyContent).toBe("center");
    expect(footer.children).toHaveLength(1);
  });
});
