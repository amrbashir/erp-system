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

export const CreateProductDto = z
  .object({
    description: z.string(),
    purchase_price: z.number(),
    selling_price: z.number(),
    stock_quantity: z.number(),
  })
  .passthrough();

export const ProductEntity = z
  .object({
    id: z.string(),
    description: z.string(),
    purchase_price: z.number(),
    selling_price: z.number(),
    stock_quantity: z.number(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const TransactionEntity = z
  .object({
    id: z.number(),
    amount: z.number(),
    createdAt: z.string().datetime({ offset: true }),
    username: z.string(),
    customerName: z.string().optional(),
  })
  .passthrough();

export const CreateInvoiceItemDto = z
  .object({
    productId: z.string(),
    quantity: z.number(),
    discount_percent: z.number().optional(),
    discount_amount: z.number().optional(),
  })
  .passthrough();

export const CreateInvoiceDto = z
  .object({
    customerId: z.number().optional(),
    items: z.array(CreateInvoiceItemDto),
    discount_percent: z.number().optional(),
    discount_amount: z.number().optional(),
  })
  .passthrough();

export const InvoiceItemEntity = z
  .object({
    description: z.string(),
    purchase_price: z.number(),
    selling_price: z.number(),
    quantity: z.number(),
    discount_percent: z.number(),
    discount_amount: z.number(),
    subtotal: z.number(),
    total: z.number(),
  })
  .passthrough();

export const InvoiceEntity = z
  .object({
    id: z.number(),
    subtotal: z.number(),
    discount_percent: z.number(),
    discount_amount: z.number(),
    total: z.number(),
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
    price: z.number(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    cashierName: z.string(),
    transactionId: z.number(),
  })
  .passthrough();
