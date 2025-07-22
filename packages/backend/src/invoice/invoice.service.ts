import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { PaginationDto } from "../pagination.dto";
import type { Customer, Invoice, InvoiceItem, User } from "../prisma/generated/client";
import type {
  InvoiceOrderByWithRelationInput,
  InvoiceWhereInput,
} from "../prisma/generated/models";
import { Prisma, TransactionType } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseInvoiceDto, CreateSaleInvoiceDto } from "./invoice.dto";

export type InvoiceWithRelations = Invoice & {
  customer: Customer | null;
  cashier: User;
  items: InvoiceItem[];
};

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async createSaleInvoice(
    orgSlug: string,
    dto: CreateSaleInvoiceDto,
    userId: string,
  ): Promise<InvoiceWithRelations> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Invoice must have at least one item");
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Check stock quantities and prepare invoice items
        const invoiceItems: Omit<InvoiceItem, "id" | "invoiceId">[] = [];
        let subtotal = new Prisma.Decimal(0);

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
            throw new BadRequestException(
              `Insufficient stock of ${product.description} (Barcode: ${product.barcode})`,
            );
          }

          // Calculate item subtotal (before invoice-level discount)
          const itemSubtotal = new Prisma.Decimal(item.price).mul(item.quantity);
          const itemPercentDiscount = itemSubtotal.mul(item.discountPercent).div(100);
          const itemTotal = itemSubtotal
            .sub(itemPercentDiscount)
            .sub(new Prisma.Decimal(item.discountAmount));

          invoiceItems.push({
            barcode: product.barcode,
            description: product.description,
            price: new Prisma.Decimal(item.price),
            purchasePrice: product.purchasePrice,
            sellingPrice: product.sellingPrice,
            quantity: item.quantity,
            discountPercent: item.discountPercent,
            discountAmount: new Prisma.Decimal(item.discountAmount),
            subtotal: itemSubtotal,
            total: itemTotal,
          });

          subtotal = subtotal.add(itemTotal);
        }

        // Apply invoice-level discount
        const percentDiscount = subtotal.mul(dto.discountPercent).div(100);
        const total = subtotal.sub(percentDiscount).sub(new Prisma.Decimal(dto.discountAmount));

        // Handle payment amount
        const paid = new Prisma.Decimal(dto.paid);

        // Validate that paid amount is not negative and doesn't exceed total
        if (paid.lessThan(0)) {
          throw new BadRequestException("Paid amount cannot be negative");
        }

        if (paid.greaterThan(total)) {
          throw new BadRequestException("Paid amount cannot exceed total invoice amount");
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
            items: { create: invoiceItems },
            subtotal,
            discountPercent: dto.discountPercent,
            discountAmount: new Prisma.Decimal(dto.discountAmount),
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
          },
        });

        await prisma.organization.update({
          where: { slug: orgSlug },
          data: { balance: { increment: paid } },
        });

        return invoice;
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Product with this ID does not exist in the organization");
      }

      throw error; // Re-throw other errors
    }
  }

  async createPurchaseInvoice(
    orgSlug: string,
    dto: CreatePurchaseInvoiceDto,
    userId: string,
  ): Promise<InvoiceWithRelations> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Invoice must have at least one item");
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Prepare invoice items
        const invoiceItems: Omit<InvoiceItem, "id" | "invoiceId" | "price">[] = [];
        let subtotal = new Prisma.Decimal(0);

        for (const [index, item] of dto.items.entries()) {
          const purchasePrice = new Prisma.Decimal(item.purchasePrice);
          const sellingPrice = new Prisma.Decimal(item.sellingPrice);

          // Check if this is a new product (no productId) and validate description
          if (!item.productId && !item.description) {
            throw new BadRequestException(
              `items.${index}.description is required for new products`,
            );
          }

          const select = {
            description: true,
            barcode: true,
          };

          const product = item.productId
            ? await prisma.product.update({
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
              })
            : await prisma.product.create({
                data: {
                  barcode: item.barcode,
                  description: item.description!, // Non-null assertion since we validated it above
                  purchasePrice,
                  sellingPrice,
                  stockQuantity: item.quantity,
                  organization: { connect: { slug: orgSlug } },
                },
                select,
              });

          // Calculate item subtotal (before invoice-level discount)
          const itemSubtotal = new Prisma.Decimal(item.purchasePrice).mul(item.quantity);
          const itemPercentDiscount = itemSubtotal.mul(item.discountPercent).div(100);
          const itemTotal = itemSubtotal
            .sub(itemPercentDiscount)
            .sub(new Prisma.Decimal(item.discountAmount));

          invoiceItems.push({
            barcode: product.barcode,
            description: product.description,
            purchasePrice: new Prisma.Decimal(item.purchasePrice),
            sellingPrice: new Prisma.Decimal(item.sellingPrice),
            quantity: item.quantity,
            discountPercent: item.discountPercent,
            discountAmount: new Prisma.Decimal(item.discountAmount),
            subtotal: itemSubtotal,
            total: itemTotal,
          });

          subtotal = subtotal.add(itemTotal);
        }

        // Apply invoice-level discount
        const percentDiscount = subtotal.mul(dto.discountPercent).div(100);
        const total = subtotal.sub(percentDiscount).sub(new Prisma.Decimal(dto.discountAmount));

        // Handle payment amount
        const paid = new Prisma.Decimal(dto.paid);

        // Validate that paid amount is not negative and doesn't exceed total
        if (paid.lessThan(0)) {
          throw new BadRequestException("Paid amount cannot be negative");
        }

        if (paid.greaterThan(total)) {
          throw new BadRequestException("Paid amount cannot exceed total invoice amount");
        }

        const remaining = total.sub(paid);

        // Prepare transaction data
        const organization = { connect: { slug: orgSlug } };
        const cashier = { connect: { id: userId } };
        const customer = dto.customerId ? { connect: { id: dto.customerId } } : undefined;
        const transaction = {
          create: {
            amount: paid.negated(), // Negative amount because it's a purchase (money going out)
            type: TransactionType.INVOICE,
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
            discountAmount: new Prisma.Decimal(dto.discountAmount),
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
          },
        });

        // Update organization balance (decrease since it's a purchase)
        await prisma.organization.update({
          where: { slug: orgSlug },
          data: { balance: { decrement: paid } },
        });

        return invoice;
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }

  async getAllInvoices(
    orgSlug: string,
    options?: {
      pagination?: PaginationDto;
      where?: Omit<InvoiceWhereInput, "organization" | "organizationId">;
      orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[] | undefined;
    },
  ): Promise<InvoiceWithRelations[]> {
    try {
      return await this.prisma.invoice.findMany({
        skip: options?.pagination?.skip,
        take: options?.pagination?.take,
        where: {
          ...options?.where,
          organization: { slug: orgSlug },
        },
        orderBy: options?.orderBy,
        include: {
          customer: true,
          cashier: true,
          items: true,
        },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }

  async getInvoicesByCustomerId(
    orgSlug: string,
    customerId: number,
    options?: {
      pagination?: PaginationDto;
      where?: Omit<
        InvoiceWhereInput,
        "customerId" | "customer" | "organization" | "organizationId"
      >;
      orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[] | undefined;
    },
  ): Promise<InvoiceWithRelations[]> {
    return await this.prisma.invoice.findMany({
      skip: options?.pagination?.skip,
      take: options?.pagination?.take,
      where: {
        ...options?.where,
        customerId,
        organization: { slug: orgSlug },
      },
      orderBy: options?.orderBy ?? { createdAt: "desc" },
      include: {
        customer: true,
        cashier: true,
        items: true,
      },
    });
  }
}
