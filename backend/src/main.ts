import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: true });

  // Diretório fora de src/dist: configure um volume persistente no servidor.
  const uploadsDir = process.env.UPLOADS_DIR
    ? (process.env.UPLOADS_DIR.startsWith('/') ? process.env.UPLOADS_DIR : join(process.cwd(), process.env.UPLOADS_DIR))
    : join(process.cwd(), 'uploads');
  mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  const port = Number(process.env.PORT ?? 3006);
  await app.listen(port, '0.0.0.0');
  console.log(`Arthere API iniciada na porta ${port} (0.0.0.0).`);
  console.log(`Diretório de imagens: ${uploadsDir}`);
}
bootstrap();
