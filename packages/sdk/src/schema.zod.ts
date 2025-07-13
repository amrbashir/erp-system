import { z } from "zod";

export const CreateOrgDto = z
  .object({
    name: z.string(),
    slug: z.string().optional(),
    username: z.string(),
    password: z.string().min(8),
  })
  .passthrough();

export const OrganizationEntity = z
  .object({ id: z.string(), name: z.string(), slug: z.string() })
  .passthrough();

export const CreateUserDto = z
  .object({
    username: z.string(),
    password: z.string().min(8),
    role: z.enum(["USER", "ADMIN"]).optional(),
  })
  .passthrough();

export const DeleteUserDto = z.object({ username: z.string() }).passthrough();

export const UserEntity = z
  .object({
    id: z.string(),
    username: z.string(),
    role: z.enum(["USER", "ADMIN"]),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    deletedAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();

export const LoginUserDto = z.object({ username: z.string(), password: z.string() }).passthrough();

export const LoginResponseDto = z
  .object({
    username: z.string(),
    role: z.enum(["USER", "ADMIN"]),
    accessToken: z.string(),
    orgSlug: z.string(),
  })
  .passthrough();

export const RefreshTokenResponseDto = z.object({ accessToken: z.string() }).passthrough();

export const CreateCustomerDto = z
  .object({ name: z.string(), address: z.string().optional(), phone: z.string().optional() })
  .passthrough();

export const CustomerEntity = z
  .object({
    id: z.number(),
    name: z.string(),
    address: z.string().optional(),
    phone: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    deletedAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();

export const ProductEntity = z
  .object({
    id: z.string(),
    barcode: z.string().optional(),
    description: z.string(),
    purchasePrice: z.string(),
    sellingPrice: z.string(),
    stockQuantity: z.number(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const TransactionEntity = z
  .object({
    id: z.number(),
    amount: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    username: z.string(),
    customerName: z.string().optional(),
  })
  .passthrough();

export const CreateSaleInvoiceItemDto = z
  .object({
    productId: z.string(),
    price: z.string(),
    quantity: z.number(),
    discountPercent: z.number().optional(),
    discountAmount: z.string().optional(),
  })
  .passthrough();

export const CreateSaleInvoiceDto = z
  .object({
    customerId: z.number().optional(),
    items: z.array(CreateSaleInvoiceItemDto),
    discountPercent: z.number().optional(),
    discountAmount: z.string().optional(),
  })
  .passthrough();

export const CreatePurchaseInvoiceItemDto = z
  .object({
    barcode: z.string().optional(),
    description: z.string(),
    purchasePrice: z.string(),
    sellingPrice: z.string(),
    quantity: z.number(),
    discountPercent: z.number().optional(),
    discountAmount: z.string().optional(),
  })
  .passthrough();

export const CreatePurchaseInvoiceDto = z
  .object({
    customerId: z.number().optional(),
    discountPercent: z.number().optional(),
    discountAmount: z.string().optional(),
    items: z.array(CreatePurchaseInvoiceItemDto),
  })
  .passthrough();

export const InvoiceItemEntity = z
  .object({
    barcode: z.string().optional(),
    description: z.string(),
    price: z.string(),
    purchasePrice: z.string(),
    sellingPrice: z.string(),
    quantity: z.number(),
    discountPercent: z.number(),
    discountAmount: z.string(),
    subtotal: z.string(),
    total: z.string(),
  })
  .passthrough();

export const InvoiceEntity = z
  .object({
    id: z.number(),
    type: z.enum(["SALE", "PURCHASE"]),
    subtotal: z.string(),
    discountPercent: z.number(),
    discountAmount: z.string(),
    total: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    cashierName: z.string(),
    customerName: z.string().optional(),
    transactionId: z.number(),
    items: z.array(InvoiceItemEntity),
  })
  .passthrough();

export const ExpenseEntity = z
  .object({
    id: z.number(),
    description: z.string(),
    price: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    cashierName: z.string(),
    transactionId: z.number(),
  })
  .passthrough();
