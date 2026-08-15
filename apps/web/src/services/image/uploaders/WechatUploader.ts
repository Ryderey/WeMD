import type { ImageUploader } from "../ImageUploader";

export const WECHAT_IMAGE_MAX_BYTES = 1024 * 1024;

interface WechatConfig {
  apiBaseUrl?: string;
  uploadKey?: string;
}

interface WechatUploadResponse {
  url?: unknown;
  message?: unknown;
  error?: unknown;
}

export class WechatUploader implements ImageUploader {
  name = "公众号";
  private config: WechatConfig;

  constructor(config?: WechatConfig) {
    this.config = config ?? {};
  }

  configure(config: WechatConfig) {
    this.config = config;
  }

  async validate(): Promise<boolean> {
    const { apiBaseUrl, uploadKey } = this.resolveConfig();
    const response = await fetch(`${apiBaseUrl}/wechat-images/status`, {
      headers: { Authorization: `Bearer ${uploadKey}` },
    });
    await this.readSuccessfulResponse(response, "公众号图床连接失败");
    return true;
  }

  async upload(file: File): Promise<string> {
    await this.validateFile(file);
    const { apiBaseUrl, uploadKey } = this.resolveConfig();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${apiBaseUrl}/wechat-images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${uploadKey}` },
      body: formData,
    });
    const data = await this.readSuccessfulResponse(
      response,
      "公众号图床上传失败",
    );
    if (typeof data.url !== "string" || data.url.length === 0) {
      throw new Error("服务器未返回图片地址");
    }
    return data.url;
  }

  private resolveConfig(): { apiBaseUrl: string; uploadKey: string } {
    const uploadKey = this.config.uploadKey?.trim();
    const configuredUrl = this.config.apiBaseUrl?.trim();
    if (!uploadKey || !configuredUrl) {
      throw new Error("公众号图床配置不完整");
    }

    let url: URL;
    try {
      url = new URL(configuredUrl);
    } catch {
      throw new Error("公众号图床 API 地址无效");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("公众号图床 API 地址仅支持 HTTP/HTTPS");
    }
    return {
      apiBaseUrl: url.toString().replace(/\/$/, ""),
      uploadKey,
    };
  }

  private async validateFile(file: File): Promise<void> {
    if (file.size >= WECHAT_IMAGE_MAX_BYTES) {
      throw new Error("微信公众号图片必须小于 1 MiB");
    }
    const isJpeg = file.type === "image/jpeg";
    const isPng = file.type === "image/png";
    if (!isJpeg && !isPng) {
      throw new Error("微信公众号图床仅支持 JPG/PNG 图片");
    }

    const bytes = await this.readHeader(file);
    const hasJpegSignature =
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff;
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const hasPngSignature =
      bytes.length >= pngSignature.length &&
      pngSignature.every((byte, index) => bytes[index] === byte);
    if ((isJpeg && !hasJpegSignature) || (isPng && !hasPngSignature)) {
      throw new Error("图片内容与文件格式不匹配");
    }
  }

  private readHeader(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(new Error("无法读取图片内容"));
      reader.readAsArrayBuffer(file.slice(0, 8));
    });
  }

  private async readResponse(
    response: Response,
  ): Promise<WechatUploadResponse> {
    try {
      const value: unknown = await response.json();
      return value && typeof value === "object"
        ? (value as WechatUploadResponse)
        : {};
    } catch {
      throw new Error("公众号图床服务返回了无效响应");
    }
  }

  private async readSuccessfulResponse(
    response: Response,
    action: string,
  ): Promise<WechatUploadResponse> {
    const data = await this.readResponse(response);
    if (response.ok) return data;

    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : response.statusText || "服务返回了未知错误";
    throw new Error(`${action}（HTTP ${response.status}）：${message}`);
  }
}
