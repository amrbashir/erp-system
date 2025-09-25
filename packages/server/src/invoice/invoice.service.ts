import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import { Decimal } from "decimal.js";

import type { PaginatedOutput, PaginationDto } from "@/dto/pagination.dto.ts";
import type { PrismaClient } from "@/prisma/client.ts";
import type {
  InvoiceItem,
  InvoiceOrderByWithRelationInput,
  InvoiceWhereInput,
} from "@/prisma/index.ts";
import { OTelInstrument } from "@/otel/instrument.decorator.ts";
import { TransactionType } from "@/prisma/index.ts";

import type {
  CreatePurchaseInvoiceDto,
  CreateSaleInvoiceDto,
  InvoiceWithRelations,
} from "./invoice.dto.ts";

export class InvoiceService {
  constructor(private readonly prisma: PrismaClient) {}

  @OTelInstrument
  async getAllInvoices(
    orgSlug: string,
    options?: {
      pagination?: PaginationDto;
      where?: Omit<InvoiceWhereInput, "organization" | "organizationId">;
      orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[];
    },
  ): Promise<PaginatedOutput<InvoiceWithRelations[]>> {
    try {
      const where = {
        ...options?.where,
        organization: { slug: orgSlug },
      };

      const invoices = await this.prisma.invoice.findMany({
        where,
        skip: options?.pagination?.skip,
        take: options?.pagination?.take,
        include: {
          customer: true,
          cashier: true,
          items: true,
          organization: { select: { name: true } },
        },
        orderBy: options?.orderBy ?? { createdAt: "desc" },
      });

      const totalCount = await this.prisma.invoice.count({ where });

      return { data: invoices, totalCount };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization with this slug does not exist",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  @OTelInstrument
  async findById(orgSlug: string, id: number): Promise<InvoiceWithRelations> {
    try {
      return await this.prisma.invoice.findUniqueOrThrow({
        where: {
          id,
          organization: { slug: orgSlug },
        },
        include: {
          customer: true,
          cashier: true,
          items: true,
          organization: { select: { name: true } },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice with this ID does not exist in the organization",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  @OTelInstrument
  async findByCustomerId(
    orgSlug: string,
    customerId: number,
    options?: {
      pagination?: PaginationDto;
      where?: Omit<InvoiceWhereInput, "organization" | "organizationId" | "customerId">;
      orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[];
    },
  ): Promise<PaginatedOutput<InvoiceWithRelations[]>> {
    try {
      const where = {
        ...options?.where,
        customerId,
        organization: { slug: orgSlug },
      };

      const invoices = await this.prisma.invoice.findMany({
        where,
        skip: options?.pagination?.skip,
        take: options?.pagination?.take,
        include: {
          customer: true,
          cashier: true,
          items: true,
          organization: { select: { name: true } },
        },
        orderBy: options?.orderBy ?? { createdAt: "desc" },
      });

      const totalCount = await this.prisma.invoice.count({ where });

      return { data: invoices, totalCount };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer with this ID does not exist in the organization",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  @OTelInstrument
  async createSaleInvoice(
    orgSlug: string,
    dto: CreateSaleInvoiceDto,
    userId: string,
  ): Promise<InvoiceWithRelations> {
    if (!dto.items || dto.items.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invoice must have at least one item",
      });
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Check stock quantities and prepare invoice items
        const invoiceItems: Omit<InvoiceItem, "id" | "invoiceId">[] = [];
        let subtotal = new Decimal(0);

        for (const item of dto.items) {
          // Find and update stock quantity
          const product = await prisma.product.update({
            where: {
              id: item.productId,
              organization: { slug: orgSlug },
            },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
            select: {
              stockQuantity: true,
              barcode: true,
              description: true,
              purchasePrice: true,
              sellingPrice: true,
            },
          });

          if (product.stockQuantity < 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient stock of ${product.description} (Barcode: ${product.barcode})`,
            });
          }

          // Calculate item subtotal (before invoice-level discount)
          const itemSubtotal = new Decimal(item.price).mul(item.quantity);
          const itemPercentDiscount = itemSubtotal.mul(item.discountPercent).div(100);
          const itemTotal = itemSubtotal
            .sub(itemPercentDiscount)
            .sub(new Decimal(item.discountAmount));

          invoiceItems.push({
            barcode: product.barcode,
            description: product.description,
            price: new Decimal(item.price),
            purchasePrice: product.purchasePrice,
            sellingPrice: product.sellingPrice,
            quantity: item.quantity,
            discountPercent: item.discountPercent,
            discountAmount: new Decimal(item.discountAmount),
            subtotal: itemSubtotal,
            total: itemTotal,
          });

          subtotal = subtotal.add(itemTotal);
        }

        // Apply invoice-level discount
        const percentDiscount = subtotal.mul(dto.discountPercent).div(100);
        const total = subtotal.sub(percentDiscount).sub(new Decimal(dto.discountAmount));

        // Handle payment amount
        const paid = new Decimal(dto.paid);

        // Validate that paid amount is not negative and doesn't exceed total
        if (paid.lessThan(0)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Paid amount cannot be negative",
          });
        }

        if (paid.greaterThan(total)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Paid amount cannot exceed total invoice amount",
          });
        }

        const remaining = total.sub(paid);

        // Prepare transaction data
        const organization = { connect: { slug: orgSlug } };
        const cashier = { connect: { id: userId, organization: organization.connect } };
        const customer = dto.customerId
          ? { connect: { id: dto.customerId, organization: organization.connect } }
          : undefined;
        const transaction = {
          create: {
            type: TransactionType.INVOICE,
            amount: paid, // Use paid amount for transaction
            cashier,
            customer,
            organization,
          },
        };

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            type: "SALE",
            items: { create: invoiceItems },
            subtotal,
            discountPercent: dto.discountPercent,
            discountAmount: new Decimal(dto.discountAmount),
            total,
            paid,
            remaining,
            cashier,
            customer,
            organization,
            transaction,
          },
          include: {
            customer: true,
            cashier: true,
            items: true,
            organization: { select: { name: true } },
          },
        });

        await prisma.organization.update({
          where: { slug: orgSlug },
          data: { balance: { increment: paid } },
        });

        return invoice;
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product with this ID does not exist in the organization",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  @OTelInstrument
  async createPurchaseInvoice(
    orgSlug: string,
    dto: CreatePurchaseInvoiceDto,
    userId: string,
  ): Promise<InvoiceWithRelations> {
    if (!dto.items || dto.items.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invoice must have at least one item",
      });
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Prepare invoice items
        const invoiceItems: Omit<InvoiceItem, "id" | "invoiceId" | "price">[] = [];
        let subtotal = new Decimal(0);

        for (const [index, item] of dto.items.entries()) {
          const purchasePrice = new Decimal(item.purchasePrice);
          const sellingPrice = new Decimal(item.sellingPrice);

          // Check if this is a new product (no productId) and validate description
          if (!item.productId && !item.description) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `items.${index}.description is required for new products`,
            });
          }

          const select = {
            description: true,
            barcode: true,
          };

          let product;
          if (item.productId) {
            // Update existing product
            product = await prisma.product.update({
              where: {
                id: item.productId,
                organization: { slug: orgSlug },
              },
              data: {
                purchasePrice,
                sellingPrice,
                stockQuantity: { increment: item.quantity },
              },
              select,
            });
          } else {
            // Create new product
            product = await prisma.product.create({
              data: {
                barcode: item.barcode,
                description: item.description || "",
                purchasePrice,
                sellingPrice,
                stockQuantity: item.quantity,
                organization: { connect: { slug: orgSlug } },
              },
              select,
            });
          }

          // Calculate item subtotal (before invoice-level discount)
          const itemSubtotal = purchasePrice.mul(item.quantity);
          const itemPercentDiscount = itemSubtotal.mul(item.discountPercent).div(100);
          const itemTotal = itemSubtotal
            .sub(itemPercentDiscount)
            .sub(new Decimal(item.discountAmount));

          invoiceItems.push({
            barcode: product.barcode,
            description: product.description,
            purchasePrice,
            sellingPrice,
            quantity: item.quantity,
            discountPercent: item.discountPercent,
            discountAmount: new Decimal(item.discountAmount),
            subtotal: itemSubtotal,
            total: itemTotal,
          });

          subtotal = subtotal.add(itemTotal);
        }

        // Apply invoice-level discount
        const percentDiscount = subtotal.mul(dto.discountPercent).div(100);
        const total = subtotal.sub(percentDiscount).sub(new Decimal(dto.discountAmount));

        // Handle payment amount
        const paid = new Decimal(dto.paid);

        // Validate that paid amount is not negative and doesn't exceed total
        if (paid.lessThan(0)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Paid amount cannot be negative",
          });
        }

        if (paid.greaterThan(total)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Paid amount cannot exceed total invoice amount",
          });
        }

        const remaining = total.sub(paid);

        // Prepare transaction data
        const organization = { connect: { slug: orgSlug } };
        const cashier = { connect: { id: userId, organization: organization.connect } };
        const customer = dto.customerId
          ? { connect: { id: dto.customerId, organization: organization.connect } }
          : undefined;
        const transaction = {
          create: {
            type: TransactionType.INVOICE,
            amount: paid.negated(), // Negate for purchase invoice
            cashier,
            customer,
            organization,
          },
        };

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            type: "PURCHASE",
            items: { create: invoiceItems },
            subtotal,
            discountPercent: dto.discountPercent,
            discountAmount: new Decimal(dto.discountAmount),
            total,
            paid,
            remaining,
            cashier,
            customer,
            organization,
            transaction,
          },
          include: {
            customer: true,
            cashier: true,
            items: true,
            organization: { select: { name: true } },
          },
        });

        await prisma.organization.update({
          where: { slug: orgSlug },
          data: { balance: { decrement: paid } },
        });

        return invoice;
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization or product with this ID does not exist",
        });
      }

      if (
        error instanceof PrismaClientKnownRequestError &&
        Array.isArray(error.meta?.target) &&
        error.code === "P2002" &&
        error.meta?.target?.includes("barcode")
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A product with this barcode already exists",
        });
      }

      throw error; // Re-throw other errors
    }
  }
}
