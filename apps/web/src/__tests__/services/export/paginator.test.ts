import { describe, expect, it } from "vitest";
import {
  getPageLayout,
  getAvailableHeight,
  planPages,
  getOversizedScale,
  RATIO_PRESETS,
  DEFAULT_RATIO_ID,
} from "../../../services/export/paginator";

describe("getPageLayout", () => {
  it("按 1080 基准生成页面参数", () => {
    const layout = getPageLayout(1080, 1440);
    expect(layout.marginX).toBe(80);
    expect(layout.marginTop).toBe(96);
    expect(layout.marginBottom).toBe(96);
    expect(layout.footerHeight).toBe(64);
    expect(layout.footerFontSize).toBe(24);
  });

  it("其他宽度等比缩放", () => {
    const layout = getPageLayout(1200, 900);
    expect(layout.marginX).toBe(Math.round(80 * (1200 / 1080)));
    expect(layout.footerHeight).toBe(Math.round(64 * (1200 / 1080)));
  });

  it("预设含默认 3:4", () => {
    const defaultPreset = RATIO_PRESETS.find(
      (preset) => preset.id === DEFAULT_RATIO_ID,
    );
    expect(defaultPreset).toMatchObject({ width: 1080, height: 1440 });
  });
});

describe("planPages", () => {
  const layout = getPageLayout(1080, 1440);
  // 可用高度 = 1440 - 96 - 96 = 1248
  const available = getAvailableHeight(layout);

  it("空内容返回空分页", () => {
    expect(planPages([], layout)).toEqual({ pages: [], oversized: [] });
  });

  it("单页放得下时合并为一页", () => {
    const blocks = [
      { index: 0, height: 400 },
      { index: 1, height: 400 },
      { index: 2, height: 400 },
    ];
    const plan = planPages(blocks, layout);
    expect(plan.pages).toEqual([[0, 1, 2]]);
    expect(plan.oversized).toEqual([]);
  });

  it("放不下下一块时换页且不切断原子块", () => {
    expect(available).toBe(1248);
    const blocks = [
      { index: 0, height: 700 },
      { index: 1, height: 700 },
      { index: 2, height: 300 },
    ];
    const plan = planPages(blocks, layout);
    expect(plan.pages).toEqual([[0], [1, 2]]);
  });

  it("超长块独占一页并标记", () => {
    const blocks = [
      { index: 0, height: 500 },
      { index: 1, height: available + 100 },
      { index: 2, height: 300 },
    ];
    const plan = planPages(blocks, layout);
    expect(plan.pages).toEqual([[0], [1], [2]]);
    expect(plan.oversized).toEqual([1]);
  });
});

describe("getOversizedScale", () => {
  const layout = getPageLayout(1080, 1440);

  it("未超长返回 1", () => {
    expect(getOversizedScale(500, layout)).toBe(1);
  });

  it("超长时返回小于 1 的缩放比", () => {
    const available = getAvailableHeight(layout);
    const scale = getOversizedScale(available * 2, layout);
    expect(scale).toBeCloseTo(0.5);
  });
});
