import { SpanStatusCode } from "@opentelemetry/api";

import { tracer } from "../otel/tracer.ts";
import { toOtelException } from "./otel-exception.ts";

export function OTelInstrument(method: any, { name }: any) {
  return function (this: any, ...args: any[]) {
    const className = this.constructor.name;
    const spanName = `${className}.${name}`;

    return tracer.startActiveSpan(spanName, async (span) => {
      for (const [index, arg] of args.entries()) {
        span.setAttribute(`arg[${index}]`, JSON.stringify(arg));
      }

      try {
        const result = await method.call(this, ...args);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(toOtelException(error));
        throw error; // Re-throw the error after recording it
      } finally {
        span.end();
      }
    });
  };
}
