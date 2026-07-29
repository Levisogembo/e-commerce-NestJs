import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Apollo-Require-Preflight',
    ],
  });

  //serve static images to frontend to display product images
  app.useStaticAssets(join(__dirname, '..', 'images'), {
    prefix: '/images',
  });
  app.enableShutdownHooks(); //enable gracefule shutdowns
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`Application is listening on port ${port}`);
}
bootstrap();
