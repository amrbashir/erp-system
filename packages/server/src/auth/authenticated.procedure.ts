import { trace } from "@opentelemetry/api";
import { TRPCError } from "@trpc/server";
import { parse as parseCookie } from "cookie";

import { otelProcedure } from "@/otel/trpc-procedure.ts";

export const authenticatedProcedure = otelProcedure.use(async ({ ctx, next }) => {
  const cookies = parseCookie(ctx.req.headers.get("Cookie") || "");
  const sid = cookies.sid;

  if (!sid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  const user = await ctx.authService.validateSession(sid, ctx.ipAddress, ctx.userAgent);
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired session",
    });
  }

  const span = trace.getActiveSpan();
  span?.setAttribute("user.id", user.id);

  return next({ ctx: { sid, user } });
});
