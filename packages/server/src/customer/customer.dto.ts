import { z } from "zod";

import type { Decimal } from "decimal.js";

import type { Customer } from "@/prisma/index.ts";

export const CustomerIdDto = z.object({
  customerId: z.number(),
});

export type CustomerIdDto = z.infer<typeof CustomerIdDto>;

export const CreateCustomerDto = z.object({
  name: z.string().nonempty(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export type CreateCustomerDto = z.infer<typeof CreateCustomerDto>;

export const UpdateCustomerDto = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export type UpdateCustomerDto = z.infer<typeof UpdateCustomerDto>;

export const MoneyTransactionDto = z.object({
  amount: z.string().nonempty(),
});

export type MoneyTransactionDto = z.infer<typeof MoneyTransactionDto>;

export interface CustomerDetails {
  balance: Decimal;
}

export type CustomerWithDetails = Customer & { details?: CustomerDetails };
