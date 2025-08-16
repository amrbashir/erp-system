import { z } from "zod";

import { PaginationDto } from "@/dto/pagination.dto.ts";
import { SortingDto } from "@/dto/sorting.dto.ts";
import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { router } from "@/trpc/index.ts";

import { GetTransactionByCustomerIdDto } from "./transaction.dto.ts";

export const transactionRouter = router({
  getAll: authenticatedOrgProcedure
    .input(z.object({ pagination: PaginationDto.optional(), sorting: SortingDto.optional() }))
    .query(({ ctx, input }) =>
      ctx.transactionService.getAll(input.orgSlug, {
        pagination: input.pagination,
        orderBy: input.sorting,
      }),
    ),

  getByCustomerId: authenticatedOrgProcedure
    .input(z.object({ pagination: PaginationDto.optional(), sorting: SortingDto.optional() }))
    .input(GetTransactionByCustomerIdDto)
    .query(({ ctx, input }) =>
      ctx.transactionService.getByCustomerId(input.orgSlug, input.customerId, {
        pagination: input.pagination,
        orderBy: input.sorting,
      }),
    ),
});
