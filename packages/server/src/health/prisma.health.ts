import { PrismaClient } from "@/prisma-client.ts";

import type { HealthCheckResponse } from "./index.ts";

const KEY = "database";

export async function check(): Promise<HealthCheckResponse> {
  try {
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return { key: KEY, status: "ok" };
  } catch (error) {
    return { key: KEY, status: "error", error };
  }
}
