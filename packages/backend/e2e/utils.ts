import { exec } from "node:child_process";
import { promisify } from "node:util";
import { PrismaService } from "../src/prisma/prisma.service.ts";
import { type INestApplication } from "@nestjs/common";
import { AppModule } from "../src/app.module.ts";
import { Test } from "@nestjs/testing";

const execAsync = promisify(exec);

export function generateRandomDb() {
  const randomDbName = `test_db_${Math.random().toString(36).substring(2, 15)}`;

  // Update the DATABASE_URL to use the random database name
  process.env.DATABASE_URL = process.env.DATABASE_URL?.replace(
    /(.*\/)(.*)(\?.*)/,
    `$1${randomDbName}$3`,
  );

  return {
    createDb: async function () {
      return execAsync(
        `docker compose exec postgres psql -U postgres -c "CREATE DATABASE ${randomDbName}"`,
      ).then(() => execAsync("pnpm prisma migrate reset --force"));
    },

    dropDb: async function (app: INestApplication) {
      const prismaService = await app.resolve(PrismaService);
      await prismaService.$disconnect();
      await sleep(1000); // Wait for disconnect to complete

      return execAsync(
        `docker compose exec postgres psql -U postgres -c "DROP DATABASE ${randomDbName}"`,
      );
    },
  };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateTestingApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  await app.init();
  await app.listen(3010);

  return app;
}
