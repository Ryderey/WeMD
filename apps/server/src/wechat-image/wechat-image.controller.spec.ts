import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { WechatImageController } from './wechat-image.controller';
import {
  WechatImageService,
  WECHAT_IMAGE_MAX_BYTES,
} from './wechat-image.service';
import { WechatUploadGuard } from './wechat-upload.guard';

const UPLOAD_KEY = '0123456789abcdef0123456789abcdef';
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0x11, 0x22]);

describe('WechatImageController', () => {
  let app: INestApplication<App>;
  let configuredKey: string | undefined;
  let upload: jest.MockedFunction<WechatImageService['upload']>;
  let checkConnection: jest.MockedFunction<
    WechatImageService['checkConnection']
  >;

  beforeEach(async () => {
    configuredKey = UPLOAD_KEY;
    upload = jest.fn().mockResolvedValue('https://mmbiz.qpic.cn/test');
    checkConnection = jest.fn().mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WechatImageController],
      providers: [
        WechatUploadGuard,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string): string | undefined =>
              key === 'WECHAT_UPLOAD_KEY' ? configuredKey : undefined,
          },
        },
        {
          provide: WechatImageService,
          useValue: { upload, checkConnection },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('protects status and upload with the configured bearer key', async () => {
    await request(app.getHttpServer())
      .get('/api/wechat-images/status')
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/wechat-images/status')
      .set('Authorization', `Bearer ${UPLOAD_KEY}`)
      .expect(200)
      .expect({ ok: true });
    expect(checkConnection).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when the server upload key is not configured', async () => {
    configuredKey = undefined;

    await request(app.getHttpServer())
      .get('/api/wechat-images/status')
      .set('Authorization', `Bearer ${UPLOAD_KEY}`)
      .expect(503);
  });

  it('passes the uploaded bytes to the WeChat module', async () => {
    await request(app.getHttpServer())
      .post('/api/wechat-images')
      .set('Authorization', `Bearer ${UPLOAD_KEY}`)
      .attach('file', JPEG, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .expect(201)
      .expect({ url: 'https://mmbiz.qpic.cn/test' });

    const file = upload.mock.calls[0]?.[0];
    expect(file?.buffer).toEqual(JPEG);
    expect(file?.originalname).toBe('test.jpg');
    expect(file?.mimetype).toBe('image/jpeg');
  });

  it('returns 400 when the multipart file is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/wechat-images')
      .set('Authorization', `Bearer ${UPLOAD_KEY}`)
      .expect(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it('returns 413 before the handler for files over one MiB', async () => {
    await request(app.getHttpServer())
      .post('/api/wechat-images')
      .set('Authorization', `Bearer ${UPLOAD_KEY}`)
      .attach('file', Buffer.alloc(WECHAT_IMAGE_MAX_BYTES + 1), {
        filename: 'large.jpg',
        contentType: 'image/jpeg',
      })
      .expect(413);
    expect(upload).not.toHaveBeenCalled();
  });
});
