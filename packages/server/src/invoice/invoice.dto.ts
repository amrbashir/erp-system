import { z } from "zod";

import type { Customer, Invoice, InvoiceItem, User } from "../prisma/index.ts";

export const CreateSaleInvoiceItemDto = z.object({
  productId: z.uuid(),
  price: z.string(),
  quantity: z.number().int().min(1),
  discountPercent: z.number().int().min(0).max(100).default(0),
  discountAmount: z.string().default("0"),
});

export type CreateSaleInvoiceItemDto = z.infer<typeof CreateSaleInvoiceItemDto>;

export const CreateSaleInvoiceDto = z.object({
  customerId: z.number().int().optional(),
  items: z.array(CreateSaleInvoiceItemDto).min(1),
  discountPercent: z.number().int().min(0).max(100).default(0),
  discountAmount: z.string().default("0"),
  paid: z.string(),
});

export type CreateSaleInvoiceDto = z.infer<typeof CreateSaleInvoiceDto>;

export const CreatePurchaseInvoiceItemDto = z.object({
  productId: z.uuid().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  purchasePrice: z.string(),
  sellingPrice: z.string(),
  quantity: z.number().int().min(1),
  discountPercent: z.number().int().min(0).max(100).default(0),
  discountAmount: z.string().default("0"),
});

export type CreatePurchaseInvoiceItemDto = z.infer<typeof CreatePurchaseInvoiceItemDto>;

export const CreatePurchaseInvoiceDto = CreateSaleInvoiceDto.omit({ items: true }).extend({
  items: z.array(CreatePurchaseInvoiceItemDto).min(1),
});

export type CreatePurchaseInvoiceDto = z.infer<typeof CreatePurchaseInvoiceDto>;

export type InvoiceWithRelations = Invoice & {
  customer: Customer | null;
  cashier: User;
  items: InvoiceItem[];
};
