import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const PORT = Number(process.env.API_PORT ?? 3001);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  await app.listen(PORT);
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${PORT}/api`);
}
void bootstrap();
