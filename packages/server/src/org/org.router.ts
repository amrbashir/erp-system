import { authRouter } from "@/auth/auth.router.ts";
import { customerRouter } from "@/customer/customer.router.ts";
import { expenseRouter } from "@/expense/expense.router.ts";
import { invoiceRouter } from "@/invoice/invoice.router.ts";
import { productRouter } from "@/product/product.router.ts";
import { transactionRouter } from "@/transaction/transaction.router.ts";
import { publicProcedure, router } from "@/trpc/index.ts";
import { userRouter } from "@/user/user.router.ts";

import { AddBalanceDto, CreateOrgDto } from "./org.dto.ts";
import { authenticatedOrgProcedure, orgProcedure } from "./org.procedure.ts";

export const orgRouter = router({
  auth: authRouter,
  users: userRouter,
  customers: customerRouter,
  expenses: expenseRouter,
  products: productRouter,
  transactions: transactionRouter,
  invoices: invoiceRouter,

  create: publicProcedure
    .input(CreateOrgDto)
    .mutation(({ ctx, input }) => ctx.orgService.create(input)),

  exists: orgProcedure.query(({ ctx, input }) => ctx.orgService.findBySlug(input.orgSlug) !== null),

  getStatistics: orgProcedure.query(({ ctx, input }) =>
    ctx.orgService.getStatistics(input.orgSlug),
  ),

  addBalance: authenticatedOrgProcedure
    .input(AddBalanceDto)
    .mutation(({ ctx, input }) => ctx.orgService.addBalance(input.orgSlug, input, ctx.user.id)),
});
