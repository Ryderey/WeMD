import { getUploadsDirectory } from './uploads-directory';

describe('getUploadsDirectory', () => {
  const originalUploadsDir = process.env.UPLOADS_DIR;

  afterEach(() => {
    if (originalUploadsDir === undefined) delete process.env.UPLOADS_DIR;
    else process.env.UPLOADS_DIR = originalUploadsDir;
  });

  it('uses the runtime uploads directory when it is configured', () => {
    process.env.UPLOADS_DIR =
      'C:\\Users\\Ryder\\AppData\\Roaming\\WeMD\\uploads';

    expect(getUploadsDirectory()).toBe(process.env.UPLOADS_DIR);
  });
});
