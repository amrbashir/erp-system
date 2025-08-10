import { SpanStatusCode } from "@opentelemetry/api";

import { publicProcedure } from "../trpc/index.ts";
import { tracer } from "./tracer.ts";

export const otelProcedure = publicProcedure.use(({ ctx, input, path, type, next }) =>
  tracer.startActiveSpan("trpc." + path, async (span) => {
    span.setAttribute("trpc.type", type);
    span.setAttribute("trpc.input", JSON.stringify(input));

    const response = await next({ ctx });

    if (response.ok) {
      span.setStatus({ code: SpanStatusCode.OK });
    } else {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(response.error);
    }
    span.end();

    return response;
  }),
);
