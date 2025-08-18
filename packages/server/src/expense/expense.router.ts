import { FilteringDto } from "@/dto/index.ts";
import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { router } from "@/trpc/index.ts";

import { CreateExpenseDto } from "./expense.dto.ts";

export const expenseRouter = router({
  getAll: authenticatedOrgProcedure.input(FilteringDto).query(({ ctx, input }) =>
    ctx.expenseService.getAll(input.orgSlug, {
      where: input.search
        ? {
            description: {
              contains: input.search,
              mode: "insensitive",
            },
          }
        : undefined,
      pagination: input.pagination,
      orderBy: input.sort,
    }),
  ),

  create: authenticatedOrgProcedure
    .input(CreateExpenseDto)
    .mutation(({ ctx, input }) => ctx.expenseService.create(input.orgSlug, input, ctx.user.id)),
});
