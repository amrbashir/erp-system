import { z } from "zod";

import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { PaginationDto } from "@/pagination.dto.ts";
import { router } from "@/trpc/index.ts";

import { GetTransactionByCustomerIdDto } from "./transaction.dto.ts";

export const transactionRouter = router({
  getAll: authenticatedOrgProcedure
    .input(z.object({ pagination: PaginationDto.optional() }))
    .query(({ ctx, input }) =>
      ctx.transactionService.getAll(input.orgSlug, { pagination: input.pagination }),
    ),

  getByCustomerId: authenticatedOrgProcedure
    .input(z.object({ pagination: PaginationDto.optional() }))
    .input(GetTransactionByCustomerIdDto)
    .query(({ ctx, input }) =>
      ctx.transactionService.getByCustomerId(input.orgSlug, input.customerId),
    ),
});
