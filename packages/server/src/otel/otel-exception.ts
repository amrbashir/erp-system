import { Exception } from "@opentelemetry/api";

export function toOtelException(error: unknown): Exception {
  return {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  };
}
