import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { PaginationDto } from "@/pagination.dto.ts";
import { router } from "@/trpc/index.ts";
import z from "zod";

import { CreateExpenseDto } from "./expense.dto.ts";

export const expenseRouter = router({
  getAll: authenticatedOrgProcedure
    .input(z.object({ pagination: PaginationDto.optional() }))
    .query(({ ctx, input }) => ctx.expenseService.getAll(input.orgSlug, input.pagination)),

  create: authenticatedOrgProcedure
    .input(CreateExpenseDto)
    .mutation(({ ctx, input }) => ctx.expenseService.create(input.orgSlug, input, ctx.user.id)),
});
