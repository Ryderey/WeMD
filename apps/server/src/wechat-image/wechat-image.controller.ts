import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  WechatImageService,
  WECHAT_IMAGE_MAX_BYTES,
} from './wechat-image.service';
import { WechatUploadGuard } from './wechat-upload.guard';

@Controller('wechat-images')
@UseGuards(WechatUploadGuard)
export class WechatImageController {
  constructor(private readonly wechatImageService: WechatImageService) {}

  @Get('status')
  async status(): Promise<{ ok: true }> {
    await this.wechatImageService.checkConnection();
    return { ok: true };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: WECHAT_IMAGE_MAX_BYTES },
    }),
  )
  async upload(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('请上传图片文件');
    return { url: await this.wechatImageService.upload(file) };
  }
}
