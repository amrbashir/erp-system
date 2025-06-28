import { exec } from "node:child_process";
import { createServer } from "node:net";
import { promisify } from "node:util";

import { Test } from "@nestjs/testing";

import { AppModule, setupApp } from "../src/app.module";

const execAsync = promisify(exec);

export function useRandomDatabase() {
  const randomDBName = `test_db_${Math.random().toString(36).substring(2, 15)}`;
  const randomDBUrl = process.env.DATABASE_URL?.replace(/(.*\/)(.*)(\?.*)/, `$1${randomDBName}$3`);

  // Set the environment variable for the database URL
  process.env.DATABASE_URL = randomDBUrl;

  const createDatabase = async () => {
    const createDbCommand = `docker compose exec postgres_db psql -U postgres -c "CREATE DATABASE ${randomDBName}"`;
    await execAsync(createDbCommand);
    await execAsync("pnpm prisma migrate reset --force");
  };

  const dropDatabase = async () => {
    const dropDbCommand = `docker compose exec postgres_db psql -U postgres -c "DROP DATABASE ${randomDBName} with (FORCE)"`;
    await execAsync(dropDbCommand);
  };

  return {
    createDatabase,
    dropDatabase,
    randomDBName,
    randomDBUrl,
  };
}

function findAvailablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const address = server.address()!;
      const port = typeof address === "string" ? parseInt(address.split(":").pop()!) : address.port;
      server.close(() => resolve(port));
    });
    server.on("error", (err: Error) => reject(err));
  });
}

export async function useTestingApp() {
  const { createDatabase, dropDatabase } = useRandomDatabase();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  setupApp(app);

  const port = await findAvailablePort();
  const appUrl = `http://localhost:${port}`;

  const runApp = async () => {
    await createDatabase();
    await app.init();
    await app.listen(port);
  };

  const closeApp = async () => {
    await app.close();
    await dropDatabase();
  };

  return {
    appUrl,
    runApp,
    closeApp,
  };
}
