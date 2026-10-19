import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true });

  const port = Number(process.env.PORT ?? 3006);

  // Escuta em todas as interfaces da máquina. O celular acessa pelo IP da máquina,
  // não por 0.0.0.0.
  await app.listen(port, '0.0.0.0');

  console.log(`Arthere API iniciada na porta ${port} (0.0.0.0).`);
  console.log('URL configurada no app: http://17.1.2.11:' + port);
}

bootstrap();
