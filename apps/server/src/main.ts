import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { mkdirSync } from 'node:fs';
import { getUploadsDirectory } from './uploads-directory';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsDirectory = getUploadsDirectory();
  mkdirSync(uploadsDirectory, { recursive: true });
  app.enableCors();
  app.setGlobalPrefix('api');

  // 配置静态文件服务
  app.useStaticAssets(uploadsDirectory, {
    prefix: '/uploads/',
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}
void bootstrap();
