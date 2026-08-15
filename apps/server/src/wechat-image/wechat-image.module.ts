import { Module } from '@nestjs/common';
import { WechatImageController } from './wechat-image.controller';
import { WechatImageService } from './wechat-image.service';
import { WechatUploadGuard } from './wechat-upload.guard';

@Module({
  controllers: [WechatImageController],
  providers: [WechatImageService, WechatUploadGuard],
})
export class WechatImageModule {}
