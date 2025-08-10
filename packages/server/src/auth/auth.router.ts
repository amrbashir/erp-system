import { TRPCError } from "@trpc/server";

import { orgProcedure } from "@/org/org.procedure.ts";
import { router } from "@/trpc/index.ts";

import type { LoginResponse } from "./auth.dto.ts";
import { LoginUserDto } from "./auth.dto.ts";
import { authenticatedProcedure } from "./authenticated.procedure.ts";

export const authRouter = router({
  me: authenticatedProcedure.query(({ ctx }) => {
    return {
      username: ctx.user.username,
      role: ctx.user.role,
      orgName: ctx.user.organization.name,
      orgSlug: ctx.user.organization.slug,
    };
  }),

  login: orgProcedure
    .input(LoginUserDto)
    .mutation(async ({ ctx, input }): Promise<LoginResponse> => {
      const user = await ctx.authService.validateUser(input);

      const sid = await ctx.authService.createSession(user.id, ctx.ipAddress, ctx.userAgent);
      const org = await ctx.orgService.findBySlug(input.orgSlug);
      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Organization with slug ${input.orgSlug} not found`,
        });
      }

      ctx.resHeaders.set("Set-Cookie", `sid=${sid}; HttpOnly; Path=/; SameSite=Strict; Secure`);

      return {
        username: user.username,
        role: user.role,
        orgName: org.name,
        orgSlug: org.slug,
      };
    }),

  logout: authenticatedProcedure.mutation(async ({ ctx }) => {
    await ctx.authService.deleteSession(ctx.sid);
    ctx.resHeaders.set("Set-Cookie", "sid=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure");
  }),
});
