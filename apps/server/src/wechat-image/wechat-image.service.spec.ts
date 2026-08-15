import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import {
  WECHAT_IMAGE_MAX_BYTES,
  WechatImageService,
} from './wechat-image.service';

function response(body: unknown, ok = true): Response {
  return { ok, json: () => Promise.resolve(body) } as Response;
}

function requestUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.toString() : input.url;
}

function imageFile(
  buffer: Buffer,
  mimetype = 'image/jpeg',
  originalname = 'test.jpg',
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype,
    size: buffer.length,
    destination: '',
    filename: originalname,
    path: '',
    buffer,
    stream: Readable.from(buffer),
  };
}

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0x11, 0x22]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('WechatImageService', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;
  let service: WechatImageService;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    service = new WechatImageService(
      new ConfigService({
        WECHAT_APP_ID: 'test-appid',
        WECHAT_APP_SECRET: 'test-appsecret',
      }),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('coalesces concurrent token refreshes and caches the token', async () => {
    fetchMock.mockResolvedValue(
      response({ access_token: 'cached-token', expires_in: 7200 }),
    );

    await Promise.all([service.checkConnection(), service.checkConnection()]);
    await service.checkConnection();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0] ?? [];
    expect(input && requestUrl(input)).toBe(
      'https://api.weixin.qq.com/cgi-bin/stable_token',
    );
    expect(init?.method).toBe('POST');
    const requestBody = init?.body;
    if (typeof requestBody !== 'string') {
      throw new Error('Expected JSON token request body');
    }
    expect(JSON.parse(requestBody)).toEqual({
      grant_type: 'client_credential',
      appid: 'test-appid',
      secret: 'test-appsecret',
      force_refresh: false,
    });
  });

  it('uploads the original bytes and returns the upstream URL', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ access_token: 'upload-token', expires_in: 7200 }),
      )
      .mockImplementationOnce(async (input, init) => {
        expect(requestUrl(input)).toContain('access_token=upload-token');
        const formData = init?.body;
        expect(formData).toBeInstanceOf(FormData);
        const media = (formData as FormData).get('media');
        expect(media).toBeInstanceOf(Blob);
        const uploaded = Buffer.from(await (media as Blob).arrayBuffer());
        expect(uploaded).toEqual(JPEG);
        expect((media as Blob).type).toBe('image/jpeg');
        expect((media as Blob & { name: string }).name).toBe('test.jpg');
        return response({
          errcode: 0,
          errmsg: 'ok',
          url: 'http://mmbiz.qpic.cn/a',
        });
      });

    await expect(service.upload(imageFile(JPEG))).resolves.toBe(
      'http://mmbiz.qpic.cn/a',
    );
  });

  it('rejects unsupported MIME types and mismatched signatures', async () => {
    await expect(
      service.upload(imageFile(JPEG, 'image/webp', 'test.webp')),
    ).rejects.toThrow('仅支持 JPG/PNG');
    await expect(service.upload(imageFile(PNG, 'image/jpeg'))).rejects.toThrow(
      '图片内容与文件格式不匹配',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects files at the one MiB boundary', async () => {
    const oversized = Buffer.alloc(WECHAT_IMAGE_MAX_BYTES);
    oversized.set(JPEG);

    await expect(service.upload(imageFile(oversized))).rejects.toThrow(
      '必须小于 1 MiB',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('force-refreshes once when WeChat rejects the cached token', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ access_token: 'old-token', expires_in: 7200 }),
      )
      .mockResolvedValueOnce(
        response({ errcode: 40014, errmsg: 'invalid token' }, false),
      )
      .mockImplementationOnce((_input, init) => {
        const requestBody = init?.body;
        if (typeof requestBody !== 'string') {
          throw new Error('Expected JSON token request body');
        }
        const body: unknown = JSON.parse(requestBody);
        expect(body).toMatchObject({ force_refresh: true });
        return Promise.resolve(
          response({ access_token: 'new-token', expires_in: 7200 }),
        );
      })
      .mockResolvedValueOnce(
        response({ errcode: 0, errmsg: 'ok', url: 'https://mmbiz.qpic.cn/b' }),
      );

    await expect(service.upload(imageFile(JPEG))).resolves.toBe(
      'https://mmbiz.qpic.cn/b',
    );
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('does not force-refresh stable tokens twice within 30 seconds', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ access_token: 'old-token', expires_in: 7200 }),
      )
      .mockResolvedValueOnce(
        response({ errcode: 40014, errmsg: 'invalid token' }),
      )
      .mockResolvedValueOnce(
        response({ access_token: 'new-token', expires_in: 7200 }),
      )
      .mockResolvedValueOnce(
        response({ errcode: 0, url: 'https://mmbiz.qpic.cn/first' }),
      )
      .mockResolvedValueOnce(
        response({ errcode: 40014, errmsg: 'invalid token' }),
      );

    await expect(service.upload(imageFile(JPEG))).resolves.toBe(
      'https://mmbiz.qpic.cn/first',
    );
    await expect(service.upload(imageFile(JPEG))).rejects.toThrow(
      '强制刷新过于频繁',
    );
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('does not expose configured credentials in upstream errors', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ access_token: 'private-access-token', expires_in: 7200 }),
      )
      .mockResolvedValueOnce(
        response({
          errcode: 45009,
          errmsg: 'test-appsecret private-access-token',
        }),
      );

    let message = '';
    try {
      await service.upload(imageFile(PNG, 'image/png', 'test.png'));
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain('45009');
    expect(message).not.toContain('test-appsecret');
    expect(message).not.toContain('private-access-token');
  });

  it('maps upstream network errors to a credential-free gateway error', async () => {
    fetchMock.mockRejectedValue(
      new Error('request contained test-appsecret private-access-token'),
    );

    let message = '';
    try {
      await service.checkConnection();
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
      expect(error).toMatchObject({ status: 502 });
    }
    expect(message).toContain('网络请求失败');
    expect(message).not.toContain('test-appsecret');
    expect(message).not.toContain('private-access-token');
  });

  it('returns a service error when AppID or AppSecret is missing', async () => {
    const unconfigured = new WechatImageService(new ConfigService({}));

    await expect(unconfigured.checkConnection()).rejects.toThrow(
      'AppID/AppSecret 未配置',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
