import { NestFactory } from "@nestjs/core";
import { AppModule, setupApp } from "./app.module";

export async function main() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  const port = process.env.NESTJS_SERVER_PORT ?? 3000;
  await app.listen(port);

  console.log(`Server running on: ${await app.getUrl()}`);
}

main();
