import { describe, expect, it } from "vitest";
import {
  generateUniqueFileName,
  sanitizeFileName,
} from "../../utils/fileNaming";

describe("sanitizeFileName", () => {
  it("清理 Windows 非法字符", () => {
    expect(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe(
      "a_b_c_d_e_f_g_h_i_j",
    );
  });

  it("去除首尾空白", () => {
    expect(sanitizeFileName("  标题  ")).toBe("标题");
  });

  it("空字符串返回默认名", () => {
    expect(sanitizeFileName("")).toBe("未命名");
    expect(sanitizeFileName("   ")).toBe("未命名");
    expect(sanitizeFileName("///")).toBe("未命名");
  });

  it("截断超长名称", () => {
    const long = "a".repeat(200);
    expect(sanitizeFileName(long).length).toBeLessThanOrEqual(100);
  });

  it("保留扩展名", () => {
    expect(sanitizeFileName("report.md")).toBe("report.md");
  });

  it("合并连续下划线", () => {
    expect(sanitizeFileName("a///b")).toBe("a_b");
  });
});

describe("generateUniqueFileName", () => {
  it("无重名时返回原始名称", () => {
    expect(generateUniqueFileName("新文章", ".md", [])).toBe("新文章.md");
    expect(generateUniqueFileName("新文章", ".md", ["其他.md"])).toBe(
      "新文章.md",
    );
  });

  it("自动递增后缀", () => {
    expect(generateUniqueFileName("新文章", ".md", ["新文章.md"])).toBe(
      "新文章-1.md",
    );
    expect(
      generateUniqueFileName("新文章", ".md", ["新文章.md", "新文章-1.md"]),
    ).toBe("新文章-2.md");
  });

  it("不补空缺", () => {
    expect(
      generateUniqueFileName("新文章", ".md", [
        "新文章.md",
        "新文章-1.md",
        "新文章-3.md",
      ]),
    ).toBe("新文章-4.md");
  });

  it("大小写不敏感", () => {
    expect(generateUniqueFileName("新文章", ".md", ["新文章.MD"])).toBe(
      "新文章-1.md",
    );
  });

  it("对文件夹扩展名为空", () => {
    expect(generateUniqueFileName("文件夹", "", ["文件夹"])).toBe("文件夹-1");
  });

  it("清理后再生成唯一名", () => {
    expect(generateUniqueFileName("新/文章", ".md", ["新_文章.md"])).toBe(
      "新_文章-1.md",
    );
  });
});
