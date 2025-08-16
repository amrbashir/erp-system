import z from "zod";

import type { Transaction } from "@/prisma/index.ts";

export const GetTransactionByCustomerIdDto = z.object({
  customerId: z.number(),
});

export type GetTransactionByCustomerIdDto = z.infer<typeof GetTransactionByCustomerIdDto>;

export type TransactionWithRelations = Transaction & {
  cashier: {
    username: string;
  };
  customer: {
    id: number;
    name: string;
  } | null;
  invoice: {
    id: number;
  } | null;
};
