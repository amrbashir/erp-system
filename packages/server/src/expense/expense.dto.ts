import { z } from "zod";

export const CreateExpenseDto = z.object({
  description: z.string().nonempty(),
  amount: z.string().nonempty(),
});

export type CreateExpenseDto = z.infer<typeof CreateExpenseDto>;
