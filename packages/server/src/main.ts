import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { VersioningType } from "@nestjs/common";

(async () => {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  const port = process.env.NESTJS_SERVER_PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on: http://localhost:${port}/v1`);
})();
