import { z } from "zod";

import { Expense, User } from "@/prisma/index.ts";

export const CreateExpenseDto = z.object({
  description: z.string().nonempty(),
  amount: z.string().nonempty(),
});

export type CreateExpenseDto = z.infer<typeof CreateExpenseDto>;

export type ExpenseWithCashier = Expense & {
  cashier: Pick<User, "username" | "id">;
};
