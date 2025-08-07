import * as prismaHealth from "./prisma.health.ts";

export type HealthCheckResponse =
  | {
      key: string;
      status: "ok";
    }
  | {
      key: string;
      status: "error";
      error: unknown;
    };

export async function handleHealthCheck() {
  const checks = [prismaHealth.check()];

  const results = await Promise.all(checks);
  const status = results.every((result) => result.status === "ok") ? "ok" : "error";
  return new Response(JSON.stringify({ status, results }), {
    headers: { "Content-Type": "application/json" },
    status: status === "ok" ? 200 : 500,
  });
}
