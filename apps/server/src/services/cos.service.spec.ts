const mockPutObject = jest.fn();

jest.mock('cos-nodejs-sdk-v5', () =>
  jest.fn(() => ({ putObject: mockPutObject })),
);

import { COSService } from './cos.service';

describe('COSService', () => {
  beforeEach(() => {
    mockPutObject.mockReset();
  });

  it('uses the COS putObject callback API for uploads', async () => {
    mockPutObject.mockImplementation(
      (
        _params: unknown,
        callback: (error: Error | null, data: unknown) => void,
      ) => {
        callback(null, {});
      },
    );
    const service = new COSService({
      secretId: 'secret-id',
      secretKey: 'secret-key',
      bucket: 'example-123',
      region: 'ap-shanghai',
    });

    await expect(
      service.uploadFile(Buffer.from('image'), 'cover.png'),
    ).resolves.toEqual({
      key: 'images/cover.png',
      url: 'https://example-123.cos.ap-shanghai.myqcloud.com/images/cover.png',
    });
    expect(mockPutObject).toHaveBeenCalledWith(
      {
        Bucket: 'example-123',
        Region: 'ap-shanghai',
        Key: 'images/cover.png',
        Body: Buffer.from('image'),
      },
      expect.any(Function),
    );
  });
});
