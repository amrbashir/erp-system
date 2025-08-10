import { initTRPC } from "@trpc/server";
import superjson from "superjson";

import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

import { AuthService } from "@/auth/auth.service.ts";
import { CustomerService } from "@/customer/customer.service.ts";
import { ExpenseService } from "@/expense/expense.service.ts";
import { InvoiceService } from "@/invoice/invoice.service.ts";
import { OrgService } from "@/org/org.service.ts";
import { ProductService } from "@/product/product.service.ts";
import { TransactionService } from "@/transaction/transaction.service.ts";
import { UserService } from "@/user/user.service.ts";

import { PrismaClient } from "../prisma/client.ts";

export const createContext = ({ req, resHeaders }: FetchCreateContextFnOptions) => {
  const prisma = new PrismaClient();
  const orgService = new OrgService(prisma);
  const userService = new UserService(prisma);
  const authService = new AuthService(prisma, userService);
  const customerService = new CustomerService(prisma);
  const expenseService = new ExpenseService(prisma);
  const productService = new ProductService(prisma);
  const transactionService = new TransactionService(prisma);
  const invoiceService = new InvoiceService(prisma);

  return {
    prisma,
    orgService,
    userService,
    authService,
    customerService,
    expenseService,
    productService,
    transactionService,
    invoiceService,
    req,
    resHeaders,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const publicProcedure = t.procedure;

export const router = t.router;
