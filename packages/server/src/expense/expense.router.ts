import z from "zod";

import { PaginationDto } from "@/dto/pagination.dto.ts";
import { SortingDto } from "@/dto/sorting.dto.ts";
import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { router } from "@/trpc/index.ts";

import { CreateExpenseDto } from "./expense.dto.ts";

export const expenseRouter = router({
  getAll: authenticatedOrgProcedure
    .input(z.object({ pagination: PaginationDto.optional(), sorting: SortingDto.optional() }))
    .query(({ ctx, input }) =>
      ctx.expenseService.getAll(input.orgSlug, {
        pagination: input.pagination,
        orderBy: input.sorting,
      }),
    ),

  create: authenticatedOrgProcedure
    .input(CreateExpenseDto)
    .mutation(({ ctx, input }) => ctx.expenseService.create(input.orgSlug, input, ctx.user.id)),
});
