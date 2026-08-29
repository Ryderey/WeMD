import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  buildRichPostArchive,
  formatRichPostArticle,
} from "../../services/richPostDelivery";

describe("richPostDelivery", () => {
  it("formats copy text with the immutable article title", () => {
    expect(formatRichPostArticle(" 原始标题 ", " 正文内容 ")).toBe(
      "标题：原始标题\n\n正文内容",
    );
  });

  it("creates a safely named ZIP with only cover.png and UTF-8 article.txt", async () => {
    const cover = new Blob([new Uint8Array([137, 80, 78, 71])], {
      type: "image/png",
    });
    const { blob, filename } = await buildRichPostArchive({
      cover,
      title: "标题:测试",
      body: "中文正文",
      now: new Date(2026, 7, 28, 9, 5),
    });
    expect(filename).toBe("WeMD-标题_测试-20260828-0905.zip");

    const archiveData = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        resolve(reader.result as ArrayBuffer),
      );
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsArrayBuffer(blob);
    });
    const zip = await JSZip.loadAsync(archiveData);
    expect(Object.keys(zip.files).sort()).toEqual(["article.txt", "cover.png"]);
    expect(await zip.file("article.txt")?.async("string")).toBe(
      "标题：标题:测试\n\n中文正文",
    );
    expect(await zip.file("cover.png")?.async("uint8array")).toEqual(
      new Uint8Array([137, 80, 78, 71]),
    );
  });
});
