import fs from "node:fs";

import { NestFactory } from "@nestjs/core";

import { AppModule, generateOpenApiJson, setupApp } from "./app.module";

export async function main() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  const port = process.env.NESTJS_SERVER_PORT ?? 3000;
  await app.listen(port);

  console.log(`Server running on: ${await app.getUrl()}`);
}

const args = process.argv.slice(2);
const mainCommand = args[0];

switch (mainCommand) {
  case "gen-openapi-json":
    const app = await NestFactory.create(AppModule);
    const openApiJson = generateOpenApiJson(app);
    fs.writeFileSync("dist/openapi.json", openApiJson, "utf8");
    break;
  default:
    main();
}
