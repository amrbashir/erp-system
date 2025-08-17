import { FilteringDto } from "@/dto/index.ts";
import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { router } from "@/trpc/index.ts";

import { GetTransactionByCustomerIdDto } from "./transaction.dto.ts";

export const transactionRouter = router({
  getAll: authenticatedOrgProcedure.input(FilteringDto).query(({ ctx, input }) =>
    ctx.transactionService.getAll(input.orgSlug, {
      where: input.search
        ? {
            OR: [
              {
                customer: {
                  name: {
                    contains: input.search,
                    mode: "insensitive",
                  },
                },
              },
              {
                cashier: {
                  username: {
                    contains: input.search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : undefined,
      pagination: input.pagination,
      orderBy: input.sorting,
    }),
  ),

  getByCustomerId: authenticatedOrgProcedure
    .input(FilteringDto)
    .input(GetTransactionByCustomerIdDto)
    .query(({ ctx, input }) =>
      ctx.transactionService.getByCustomerId(input.orgSlug, input.customerId, {
        where: input.search
          ? {
              OR: [
                {
                  customer: {
                    name: {
                      contains: input.search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  cashier: {
                    username: {
                      contains: input.search,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : undefined,
        pagination: input.pagination,
        orderBy: input.sorting,
      }),
    ),
});
