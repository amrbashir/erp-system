import { z } from "zod";

export const CreateOrgDto = z.object({
  name: z.string(),
  slug: z.string().optional(),
  username: z.string(),
  password: z.string().min(8),
});

export const OrganizationEntity = z.object({ id: z.string(), name: z.string(), slug: z.string() });

export const BalanceAtDateStisticDto = z.object({
  date: z.string().datetime({ offset: true }),
  balance: z.string(),
});

export const OrgStatisticsDto = z.object({
  balance: z.string(),
  transactionCount: z.number(),
  balanceAtDate: z.array(BalanceAtDateStisticDto),
});

export const OrganizationEntityWithStatistics = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  statistics: OrgStatisticsDto,
  balance: z.string(),
});

export const AddBalanceDto = z.object({ amount: z.string() });

export const UserEntity = z.object({
  id: z.string(),
  username: z.string(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).optional(),
});

export const CreateUserDto = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const LoginUserDto = z.object({ username: z.string(), password: z.string() });

export const LoginResponseDto = z.object({
  username: z.string(),
  role: z.enum(["USER", "ADMIN"]),
  orgName: z.string(),
  orgSlug: z.string(),
});

export const CustomerDetails = z.object({ balance: z.string() });

export const CustomerEntity = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).optional(),
  details: CustomerDetails.optional(),
});

export const CreateCustomerDto = z.object({
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const UpdateCustomerDto = z.object({
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const CollectMoneyDto = z.object({ amount: z.string() });

export const PayMoneyDto = z.object({ amount: z.string() });

export const ProductEntity = z.object({
  id: z.string(),
  barcode: z.string().optional(),
  description: z.string(),
  purchasePrice: z.string(),
  sellingPrice: z.string(),
  stockQuantity: z.number(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const UpdateProductDto = z
  .object({
    barcode: z.string(),
    description: z.string(),
    purchasePrice: z.string(),
    sellingPrice: z.string(),
    stockQuantity: z.number(),
  })
  .partial();

export const TransactionEntity = z.object({
  id: z.number(),
  type: z.enum([
    "INVOICE",
    "EXPENSE",
    "BALANCE_ADDITION",
    "COLLECT_FROM_CUSTOMER",
    "PAY_TO_CUSTOMER",
  ]),
  amount: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  cashierUsername: z.string(),
  customerName: z.string().optional(),
  customerId: z.number().optional(),
  invoiceId: z.number().optional(),
});

export const InvoiceItemEntity = z.object({
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
});

export const InvoiceEntity = z.object({
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
});

export const CreateSaleInvoiceItemDto = z.object({
  productId: z.string(),
  price: z.string(),
  quantity: z.number(),
  discountPercent: z.number().optional(),
  discountAmount: z.string().optional(),
});

export const CreateSaleInvoiceDto = z.object({
  customerId: z.number().optional(),
  items: z.array(CreateSaleInvoiceItemDto),
  discountPercent: z.number().optional(),
  discountAmount: z.string().optional(),
  paid: z.string(),
});

export const CreatePurchaseInvoiceItemDto = z.object({
  productId: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  purchasePrice: z.string(),
  sellingPrice: z.string(),
  quantity: z.number(),
  discountPercent: z.number().optional(),
  discountAmount: z.string().optional(),
});

export const CreatePurchaseInvoiceDto = z.object({
  customerId: z.number().optional(),
  discountPercent: z.number().optional(),
  discountAmount: z.string().optional(),
  paid: z.string(),
  items: z.array(CreatePurchaseInvoiceItemDto),
});

export const ExpenseEntity = z.object({
  id: z.number(),
  description: z.string(),
  amount: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  cashierName: z.string(),
  transactionId: z.number(),
});

export const CreateExpenseDto = z.object({ description: z.string(), amount: z.string() });
