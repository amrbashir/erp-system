import fs from "node:fs";

import { NestFactory } from "@nestjs/core";

import type { LogLevel } from "@nestjs/common";

import { AppModule, generateOpenApiJson, setupApp } from "./app.module";

export async function main() {
  // Setup log levels based on environment
  const isDev = process.env.NODE_ENV === "development";
  const devLogLevels: LogLevel[] = isDev ? (["debug", "verbose"] as const) : [];
  const logLevels: LogLevel[] = ["log", "error", "warn", ...devLogLevels];

  const app = await NestFactory.create(AppModule, { logger: logLevels });
  setupApp(app);

  await app.listen(3000);

  console.log(`Server running on: ${await app.getUrl()}`);
}

const args = process.argv.slice(2);
const mainCommand = args[0];

switch (mainCommand) {
  case "gen-openapi-json":
    console.log("Setting up app...");
    const app = await NestFactory.create(AppModule, { logger: false });

    console.log("Generating JSON...");
    const openApiJson = generateOpenApiJson(app);

    console.log("Writing JSON to disk...");
    fs.writeFileSync("dist/openapi.json", openApiJson, "utf8");

    console.log("\x1b[32mSuccessfully generated OpenAPI JSON → \x1b[1mdist/openapi.json\x1b[0m");
    break;
  default:
    main();
}
