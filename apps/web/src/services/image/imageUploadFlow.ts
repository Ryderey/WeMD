import { ImageHostManager, type ImageHostConfig } from "./ImageUploader";
import {
  type ImageCompressionDependencies,
  type PrepareImageForUploadOptions,
  prepareImageForUpload,
} from "./autoCompressImage";
import { cacheWechatPreviewImage } from "./wechatPreviewCache";

export interface UploadEditorImageOptions {
  compressionOptions?: PrepareImageForUploadOptions;
  compressionDependencies?: ImageCompressionDependencies;
  getImageHostConfig?: () => ImageHostConfig;
  createManager?: (config: ImageHostConfig) => {
    upload: (file: File) => Promise<string>;
  };
  cacheWechatPreview?: (url: string, file: File) => Promise<void>;
}

export interface UploadEditorImageResult {
  url: string;
  sourceFile: File;
  uploadedFile: File;
  compressed: boolean;
  originalSize: number;
  finalSize: number;
}

export function getStoredImageHostConfig(): ImageHostConfig {
  const configStr = localStorage.getItem("imageHostConfig");
  if (!configStr) {
    return { type: "official" };
  }

  try {
    return JSON.parse(configStr) as ImageHostConfig;
  } catch {
    return { type: "official" };
  }
}

export async function uploadEditorImage(
  sourceFile: File,
  options: UploadEditorImageOptions = {},
): Promise<UploadEditorImageResult> {
  const config = options.getImageHostConfig
    ? options.getImageHostConfig()
    : getStoredImageHostConfig();
  const prepared =
    config.type === "wechat"
      ? {
          file: sourceFile,
          originalSize: sourceFile.size,
          finalSize: sourceFile.size,
          compressed: false,
        }
      : await prepareImageForUpload(
          sourceFile,
          options.compressionOptions,
          options.compressionDependencies,
        );
  const manager = options.createManager
    ? options.createManager(config)
    : new ImageHostManager(config);
  const url = await manager.upload(prepared.file);
  if (config.type === "wechat") {
    try {
      await (options.cacheWechatPreview ?? cacheWechatPreviewImage)(
        url,
        sourceFile,
      );
    } catch (error) {
      console.warn("[WechatPreviewCache] save failed", error);
    }
  }

  return {
    url,
    sourceFile,
    uploadedFile: prepared.file,
    compressed: prepared.compressed,
    originalSize: prepared.originalSize,
    finalSize: prepared.finalSize,
  };
}
