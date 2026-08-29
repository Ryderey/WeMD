import JSZip from "jszip";
import { buildExportBaseName, downloadBlob } from "./export/exportService";

export function formatRichPostArticle(title: string, body: string): string {
  return `标题：${title.trim()}\n\n${body.trim()}`;
}

export async function buildRichPostArchive(input: {
  cover: Blob;
  title: string;
  body: string;
  now?: Date;
}): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();
  zip.file("cover.png", input.cover);
  zip.file("article.txt", formatRichPostArticle(input.title, input.body));
  return {
    blob: await zip.generateAsync({ type: "blob" }),
    filename: `${buildExportBaseName(input.title, input.now)}.zip`,
  };
}

export async function downloadRichPostArchive(input: {
  cover: Blob;
  title: string;
  body: string;
  now?: Date;
}): Promise<string> {
  const archive = await buildRichPostArchive(input);
  downloadBlob(archive.blob, archive.filename);
  return archive.filename;
}
