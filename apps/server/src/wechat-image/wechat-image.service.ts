import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const STABLE_TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/stable_token';
const UPLOAD_IMAGE_URL = 'https://api.weixin.qq.com/cgi-bin/media/uploadimg';
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const FORCE_REFRESH_MIN_INTERVAL_MS = 30 * 1000;
export const WECHAT_IMAGE_MAX_BYTES = 1024 * 1024;
const RETRYABLE_TOKEN_ERROR_CODES = new Set([40001, 40014, 42001]);

interface CachedToken {
  value: string;
  expiresAt: number;
}

interface WechatResponse {
  access_token?: unknown;
  expires_in?: unknown;
  url?: unknown;
  errcode?: unknown;
  errmsg?: unknown;
}

@Injectable()
export class WechatImageService {
  private cachedToken: CachedToken | null = null;
  private refreshPromise: Promise<string> | null = null;
  private lastForceRefreshAt = 0;

  constructor(private readonly configService: ConfigService) {}

  async checkConnection(): Promise<void> {
    await this.getAccessToken(false);
  }

  async upload(file: Express.Multer.File): Promise<string> {
    this.validateFile(file);

    let accessToken = await this.getAccessToken(false);
    let result = await this.uploadToWechat(file, accessToken);

    if (this.isRetryableTokenError(result)) {
      this.cachedToken = null;
      accessToken = await this.getAccessToken(true);
      result = await this.uploadToWechat(file, accessToken);
    }

    const errcode = this.numberValue(result.errcode);
    if (errcode !== null && errcode !== 0) {
      throw this.upstreamError('微信图片上传失败', result);
    }
    if (typeof result.url !== 'string' || result.url.length === 0) {
      throw new BadGatewayException('微信图片上传失败：未返回图片地址');
    }

    return result.url;
  }

  private validateFile(file: Express.Multer.File): void {
    if (file.buffer.length >= WECHAT_IMAGE_MAX_BYTES) {
      throw new PayloadTooLargeException('微信公众号图片必须小于 1 MiB');
    }

    const isJpeg = file.mimetype === 'image/jpeg';
    const isPng = file.mimetype === 'image/png';
    if (!isJpeg && !isPng) {
      throw new BadRequestException('微信公众号图床仅支持 JPG/PNG 图片');
    }

    if (
      (isJpeg && !this.hasJpegSignature(file.buffer)) ||
      (isPng && !this.hasPngSignature(file.buffer))
    ) {
      throw new BadRequestException('图片内容与文件格式不匹配');
    }
  }

  private hasJpegSignature(buffer: Buffer): boolean {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  private hasPngSignature(buffer: Buffer): boolean {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return (
      buffer.length >= signature.length &&
      signature.every((byte, index) => buffer[index] === byte)
    );
  }

  private async getAccessToken(forceRefresh: boolean): Promise<string> {
    if (
      !forceRefresh &&
      this.cachedToken &&
      this.cachedToken.expiresAt > Date.now()
    ) {
      return this.cachedToken.value;
    }
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.fetchAccessToken(forceRefresh).finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async fetchAccessToken(forceRefresh: boolean): Promise<string> {
    if (
      forceRefresh &&
      Date.now() - this.lastForceRefreshAt < FORCE_REFRESH_MIN_INTERVAL_MS
    ) {
      throw new BadGatewayException(
        '微信 access token 强制刷新过于频繁，请稍后重试',
      );
    }
    if (forceRefresh) this.lastForceRefreshAt = Date.now();

    const appid = this.configService.get<string>('WECHAT_APP_ID')?.trim();
    const secret = this.configService.get<string>('WECHAT_APP_SECRET')?.trim();
    if (!appid || !secret) {
      throw new ServiceUnavailableException(
        '微信公众号 AppID/AppSecret 未配置',
      );
    }

    const response = await this.fetchWechat(
      STABLE_TOKEN_URL,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credential',
          appid,
          secret,
          force_refresh: forceRefresh,
        }),
      },
      '获取微信 access token 失败',
    );
    const result = await this.readWechatResponse(response);
    const errcode = this.numberValue(result.errcode);
    if (!response.ok || (errcode !== null && errcode !== 0)) {
      throw this.upstreamError('获取微信 access token 失败', result);
    }
    if (
      typeof result.access_token !== 'string' ||
      typeof result.expires_in !== 'number'
    ) {
      throw new BadGatewayException('获取微信 access token 失败：响应无效');
    }

    this.cachedToken = {
      value: result.access_token,
      expiresAt:
        Date.now() +
        Math.max(1000, result.expires_in * 1000 - TOKEN_REFRESH_MARGIN_MS),
    };
    return result.access_token;
  }

  private async uploadToWechat(
    file: Express.Multer.File,
    accessToken: string,
  ): Promise<WechatResponse> {
    const formData = new FormData();
    const bytes = Uint8Array.from(file.buffer);
    formData.append(
      'media',
      new Blob([bytes.buffer], { type: file.mimetype }),
      file.originalname,
    );
    const response = await this.fetchWechat(
      `${UPLOAD_IMAGE_URL}?access_token=${encodeURIComponent(accessToken)}`,
      { method: 'POST', body: formData },
      '微信图片上传失败',
    );
    const result = await this.readWechatResponse(response);
    if (!response.ok && !this.isRetryableTokenError(result)) {
      throw this.upstreamError('微信图片上传失败', result);
    }
    return result;
  }

  private async readWechatResponse(
    response: Response,
  ): Promise<WechatResponse> {
    try {
      const value: unknown = await response.json();
      return value && typeof value === 'object'
        ? (value as WechatResponse)
        : {};
    } catch {
      throw new BadGatewayException('微信接口返回了无效响应');
    }
  }

  private async fetchWechat(
    input: string,
    init: RequestInit,
    errorMessage: string,
  ): Promise<Response> {
    try {
      return await fetch(input, init);
    } catch {
      throw new BadGatewayException(`${errorMessage}：网络请求失败`);
    }
  }

  private isRetryableTokenError(response: WechatResponse): boolean {
    const errcode = this.numberValue(response.errcode);
    return errcode !== null && RETRYABLE_TOKEN_ERROR_CODES.has(errcode);
  }

  private numberValue(value: unknown): number | null {
    return typeof value === 'number' ? value : null;
  }

  private upstreamError(
    prefix: string,
    response: WechatResponse,
  ): BadGatewayException {
    const errcode = this.numberValue(response.errcode);
    const code = errcode === null ? '' : ` (${errcode})`;
    const ip =
      errcode === 40164 ? this.ipv4Address(response.errmsg) : undefined;
    const whitelistFailure = ip ? `：服务器出口 IP ${ip} 未加入白名单` : '';
    return new BadGatewayException(`${prefix}${code}${whitelistFailure}`);
  }

  private ipv4Address(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;

    return value.match(
      /\b(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\b/,
    )?.[0];
  }
}
