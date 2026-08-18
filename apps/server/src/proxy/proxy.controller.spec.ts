import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { fetch as undiciFetch } from 'undici';
import { ProxyModule } from './proxy.module';

jest.mock('undici', () => ({
  fetch: jest.fn(),
  ProxyAgent: class MockProxyAgent {},
}));

const fetchMock = undiciFetch as unknown as jest.Mock;

const imageResponse = (bytes: number[] = [1, 2, 3]) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'image/png' },
  arrayBuffer: async () => new Uint8Array(bytes).buffer,
});

describe('ProxyController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProxyModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('url 参数非法返回 400', async () => {
    const res = await request(app.getHttpServer()).get(
      '/proxy/image?url=not-a-url',
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('非 http/https 协议返回 400', async () => {
    const res = await request(app.getHttpServer()).get(
      '/proxy/image?url=ftp://example.com/a.png',
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('上游非图片类型返回 400', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html' },
      arrayBuffer: async () => new Uint8Array([60]).buffer,
    });
    const res = await request(app.getHttpServer()).get(
      '/proxy/image?url=https://example.com/a.png',
    );
    expect(res.status).toBe(400);
  });

  it('上游非 2xx 返回 400', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => 'image/png' },
      arrayBuffer: async () => new Uint8Array([]).buffer,
    });
    const res = await request(app.getHttpServer()).get(
      '/proxy/image?url=https://example.com/a.png',
    );
    expect(res.status).toBe(400);
  });

  it('成功时回传图片字节与 content-type', async () => {
    fetchMock.mockResolvedValue(imageResponse([9, 8, 7]));
    const res = await request(app.getHttpServer()).get(
      '/proxy/image?url=https://example.com/a.png',
    );
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(res.body).toEqual(Buffer.from([9, 8, 7]));
  });
});
