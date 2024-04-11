import fastifyCookie from '@fastify/cookie';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );
  await app.register(fastifyCookie, {
    secret: 'my-secret', // for cookies signature
    parseOptions: {
      path: '/', // fondamentale per poter leggere i cookie anche dal browser
    },
  });
  await app.listen(3000);
}
bootstrap();
