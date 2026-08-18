import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { fetch as undiciFetch, ProxyAgent } from 'undici';

/** 代理图片大小上限（与上传限制保持一致的量级，略放宽） */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
/** 上游抓取超时 */
const FETCH_TIMEOUT_MS = 15_000;

/**
 * 图片代理：服务端抓取远程图片并回传
 * 浏览器对无 CORS 头的图床无法 fetch 读取字节，导致 canvas 截图留白；
 * 服务端不受 CORS 限制，作为导出管线的回退取图通道。
 */
@Controller('proxy')
export class ProxyController {
  private readonly dispatcher: ProxyAgent | null;

  constructor() {
    // 开发机/内网环境常经代理出网，Node fetch 默认不读代理环境变量
    const proxyUrl =
      process.env.https_proxy ||
      process.env.HTTPS_PROXY ||
      process.env.http_proxy ||
      process.env.HTTP_PROXY;
    this.dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : null;
  }

  @Get('image')
  async image(
    @Query('url') url: string,
    @Res() res: Response,
  ): Promise<void> {
    let target: URL;
    try {
      target = new URL(url);
    } catch {
      throw new BadRequestException('url 参数非法');
    }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      throw new BadRequestException('仅支持 http/https 协议');
    }

    const aborter = new AbortController();
    const timer = setTimeout(() => aborter.abort(), FETCH_TIMEOUT_MS);
    try {
      const upstream = await undiciFetch(target.toString(), {
        signal: aborter.signal,
        redirect: 'follow',
        ...(this.dispatcher ? { dispatcher: this.dispatcher } : {}),
      });
      if (!upstream.ok) {
        throw new BadRequestException(`上游响应异常: ${upstream.status}`);
      }
      const contentType =
        upstream.headers.get('content-type')?.split(';')[0].trim() ?? '';
      if (!contentType.startsWith('image/')) {
        throw new BadRequestException('目标资源不是图片');
      }
      const buffer = Buffer.from(await upstream.arrayBuffer());
      if (buffer.length > MAX_IMAGE_BYTES) {
        throw new BadRequestException('图片超出大小限制');
      }
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('代理抓取失败');
    } finally {
      clearTimeout(timer);
    }
  }
}
