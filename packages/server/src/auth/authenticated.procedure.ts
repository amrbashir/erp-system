import { publicProcedure } from "@/trpc/index.ts";
import { TRPCError } from "@trpc/server";
import { parse as parseCookie } from "cookie";

export const authenticatedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const cookies = parseCookie(ctx.req.headers.get("Cookie") || "");
  const sid = cookies.sid;

  if (!sid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  const user = await ctx.authService.validateSession(sid);
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired session",
    });
  }

  return next({ ctx: { sid, user } });
});
