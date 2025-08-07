import { TRPCError } from "@trpc/server";

import { authenticatedProcedure } from "@/auth/authenticated.procedure.ts";
import { orgProcedure } from "@/org/org.procedure.ts";
import { UserRole } from "@/prisma.ts";

export const adminProcedure = authenticatedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== UserRole.ADMIN) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action",
    });
  }

  return next();
});

export const admingOrgProcedure = adminProcedure.concat(orgProcedure);
