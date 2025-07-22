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
  .object({ id: z.string(), name: z.string(), slug: z.string(), balance: z.string().optional() })
  .passthrough();

export const AddBalanceDto = z.object({ amount: z.string() }).passthrough();

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

export const CreateUserDto = z
  .object({
    username: z.string().min(3),
    password: z.string().min(8),
    role: z.enum(["USER", "ADMIN"]).optional(),
  })
  .passthrough();

export const LoginUserDto = z.object({ username: z.string(), password: z.string() }).passthrough();

export const LoginResponseDto = z
  .object({ username: z.string(), role: z.enum(["USER", "ADMIN"]), orgSlug: z.string() })
  .passthrough();

export const CustomerDetails = z
  .object({ amountReceivable: z.string(), amountPayable: z.string() })
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
    details: CustomerDetails.optional(),
  })
  .passthrough();

export const CreateCustomerDto = z
  .object({ name: z.string(), address: z.string().optional(), phone: z.string().optional() })
  .passthrough();

export const UpdateCustomerDto = z
  .object({ name: z.string(), address: z.string().optional(), phone: z.string().optional() })
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

export const UpdateProductDto = z
  .object({
    barcode: z.string(),
    description: z.string(),
    purchasePrice: z.string(),
    sellingPrice: z.string(),
    stockQuantity: z.number(),
  })
  .partial()
  .passthrough();

export const TransactionEntity = z
  .object({
    id: z.number(),
    type: z.enum(["INVOICE", "EXPENSE", "BALANCE_ADDITION"]),
    amount: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    cashierUsername: z.string(),
    customerName: z.string().optional(),
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
    paid: z.string(),
    remaining: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    cashierName: z.string(),
    customerName: z.string().optional(),
    transactionId: z.number(),
    items: z.array(InvoiceItemEntity),
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
    paid: z.string(),
  })
  .passthrough();

export const CreatePurchaseInvoiceItemDto = z
  .object({
    productId: z.string().optional(),
    barcode: z.string().optional(),
    description: z.string().optional(),
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
    paid: z.string(),
    items: z.array(CreatePurchaseInvoiceItemDto),
  })
  .passthrough();

export const ExpenseEntity = z
  .object({
    id: z.number(),
    description: z.string(),
    amount: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    cashierName: z.string(),
    transactionId: z.number(),
  })
  .passthrough();

export const CreateExpenseDto = z
  .object({ description: z.string(), amount: z.string() })
  .passthrough();
