import { FilteringDto } from "@/dto/index.ts";
import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { router } from "@/trpc/index.ts";

import {
  CreateCustomerDto,
  CustomerIdDto,
  MoneyTransactionDto,
  UpdateCustomerDto,
} from "./customer.dto.ts";

const customerProcedure = authenticatedOrgProcedure.input(CustomerIdDto);

export const customerRouter = router({
  getAll: authenticatedOrgProcedure.input(FilteringDto).query(({ ctx, input }) =>
    ctx.customerService.getAll(input.orgSlug, {
      where: input.search
        ? {
            name: {
              contains: input.search,
              mode: "insensitive",
            },
          }
        : undefined,
      pagination: input.pagination,
      orderBy: input.sorting,
    }),
  ),

  create: authenticatedOrgProcedure
    .input(CreateCustomerDto)
    .mutation(({ ctx, input }) => ctx.customerService.create(input, input.orgSlug)),

  update: customerProcedure
    .input(UpdateCustomerDto)
    .mutation(({ ctx, input }) =>
      ctx.customerService.update(input.customerId, input, input.orgSlug),
    ),

  getById: customerProcedure.query(({ ctx, input }) =>
    ctx.customerService.findById(input.customerId, input.orgSlug),
  ),

  collectMoney: customerProcedure
    .input(MoneyTransactionDto)
    .mutation(({ ctx, input }) =>
      ctx.customerService.collectMoney(input.customerId, input.amount, input.orgSlug, ctx.user.id),
    ),

  payMoney: customerProcedure
    .input(MoneyTransactionDto)
    .mutation(({ ctx, input }) =>
      ctx.customerService.payMoney(input.customerId, input.amount, input.orgSlug, ctx.user.id),
    ),
});
