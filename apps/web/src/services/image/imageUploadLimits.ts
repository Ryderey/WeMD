import type { ImageHostConfig } from "./ImageUploader";

export interface ImageUploadLimit {
  limitBytes: number;
  strictLessThan: boolean;
  allowedTypes: readonly string[] | null;
}

export const WECHAT_IMAGE_UPLOAD_LIMIT_BYTES = 950_000;
export const SELF_HOSTED_IMAGE_UPLOAD_LIMIT_BYTES = 4_500_000;
export const DEFAULT_IMAGE_UPLOAD_LIMIT_BYTES = 9_000_000;

export const WECHAT_UPLOAD_ALLOWED_TYPES = ["image/jpeg", "image/png"] as const;

export function resolveImageUploadLimit(
  config: ImageHostConfig,
): ImageUploadLimit {
  if (config.type === "wechat") {
    // 微信 uploadimg 按十进制 1,000,000 字节判定，且请求体还要覆盖 multipart 与代理层封装开销。
    return {
      limitBytes: WECHAT_IMAGE_UPLOAD_LIMIT_BYTES,
      strictLessThan: true,
      allowedTypes: WECHAT_UPLOAD_ALLOWED_TYPES,
    };
  }
  if (config.type === "official") {
    // official 可能指向自建 apps/server（multer 5 MB 入站上限），按可确证的最严口径保守取值。
    return {
      limitBytes: SELF_HOSTED_IMAGE_UPLOAD_LIMIT_BYTES,
      strictLessThan: false,
      allowedTypes: null,
    };
  }
  return {
    limitBytes: DEFAULT_IMAGE_UPLOAD_LIMIT_BYTES,
    strictLessThan: false,
    allowedTypes: null,
  };
}

export function exceedsImageUploadLimit(
  sizeInBytes: number,
  limit: ImageUploadLimit,
): boolean {
  return limit.strictLessThan
    ? sizeInBytes >= limit.limitBytes
    : sizeInBytes > limit.limitBytes;
}

export function isAllowedImageUploadType(
  file: File,
  limit: ImageUploadLimit,
): boolean {
  return limit.allowedTypes === null || limit.allowedTypes.includes(file.type);
}

export function formatByteCount(sizeInBytes: number): string {
  return String(sizeInBytes).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatTotalUploadSize(sizeInBytes: number): string {
  return `${(sizeInBytes / 1024 / 1024).toFixed(2)} MiB（${formatByteCount(sizeInBytes)} 字节）`;
}
