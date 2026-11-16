import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true });
  app.getHttpAdapter().getInstance().use('/uploads', require('express').static(join(process.cwd(), 'uploads'), { maxAge: '7d', immutable: true }));

  const port = Number(process.env.PORT ?? 3006);

  // Escuta em todas as interfaces da máquina. O celular acessa pelo IP da máquina,
  // não por 0.0.0.0.
  await app.listen(port, '0.0.0.0');

  console.log(`Arthere API iniciada na porta ${port} (0.0.0.0).`);
  console.log(`URL para o app na rede local: http://172.20.10.2:${port}`);
}

bootstrap();
