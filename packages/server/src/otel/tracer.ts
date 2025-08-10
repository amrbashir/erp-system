import { trace } from "@opentelemetry/api";

export const tracer = trace.getTracer("@erp-system/server");
