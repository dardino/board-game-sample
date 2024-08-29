import fastifyCookie from "@fastify/cookie";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./errors/exceptionsFilter";

async function bootstrap () {

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );
  await app.register(
    fastifyCookie as never,
    {
      secret: "my-secret", // for cookies signature
      parseOptions: {
        path: "/", // fondamentale per poter leggere i cookie anche dal browser
      },
    },
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);

}
bootstrap();
