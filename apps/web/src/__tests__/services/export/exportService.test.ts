import { describe, expect, it } from "vitest";
import {
  resolveExportTitle,
  buildExportBaseName,
  buildFileNames,
  measureBlocks,
} from "../../../services/export/exportService";

describe("resolveExportTitle", () => {
  it("无文件时回退 WeMD", () => {
    expect(resolveExportTitle(undefined)).toBe("WeMD");
    expect(resolveExportTitle("")).toBe("WeMD");
  });

  it("取 basename 并去扩展名（Windows 路径）", () => {
    expect(resolveExportTitle("D:\\docs\\我的文章.md")).toBe("我的文章");
  });

  it("取 basename 并去扩展名（POSIX 路径）", () => {
    expect(resolveExportTitle("/docs/note.md")).toBe("note");
  });

  it("清洗文件名非法字符", () => {
    expect(resolveExportTitle("/docs/a/b:c*d.md")).toBe("b_c_d");
  });
});

describe("buildExportBaseName", () => {
  it("生成 WeMD-{标题}-{yyyyMMdd-HHmm} 格式", () => {
    const fixed = new Date(2026, 7, 17, 9, 5);
    expect(buildExportBaseName("测试", fixed)).toBe("WeMD-测试-20260817-0905");
  });
});

describe("buildFileNames", () => {
  it("单张使用完整基础名", () => {
    expect(buildFileNames("WeMD-a-20260817-0905", 1, "png")).toEqual([
      "WeMD-a-20260817-0905.png",
    ]);
  });

  it("多张使用序号命名", () => {
    expect(buildFileNames("base", 3, "jpeg")).toEqual([
      "01.jpg",
      "02.jpg",
      "03.jpg",
    ]);
  });
});

describe("measureBlocks", () => {
  const stubLayout = (
    el: HTMLElement,
    offsetTop: number,
    offsetHeight: number,
  ) => {
    Object.defineProperty(el, "offsetTop", { value: offsetTop });
    Object.defineProperty(el, "offsetHeight", { value: offsetHeight });
  };

  it("末块取自身高度而非累计偏移（回归：末块误判超长）", () => {
    const root = document.createElement("div");
    const first = document.createElement("p");
    const last = document.createElement("p");
    root.append(first, last);
    stubLayout(first, 0, 400);
    stubLayout(last, 420, 100);

    const measures = measureBlocks(root);
    expect(measures[0].height).toBe(420);
    expect(measures[1].height).toBe(100);
  });
});
