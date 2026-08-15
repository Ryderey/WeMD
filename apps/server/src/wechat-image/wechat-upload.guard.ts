import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

const MIN_UPLOAD_KEY_LENGTH = 32;

@Injectable()
export class WechatUploadGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configuredKey = this.configService
      .get<string>('WECHAT_UPLOAD_KEY')
      ?.trim();
    if (!configuredKey || configuredKey.length < MIN_UPLOAD_KEY_LENGTH) {
      throw new ServiceUnavailableException('微信公众号图床服务未配置');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const providedKey = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : '';

    const expected = Buffer.from(configuredKey);
    const actual = Buffer.from(providedKey);
    if (
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    ) {
      throw new UnauthorizedException('上传密钥无效');
    }

    return true;
  }
}
